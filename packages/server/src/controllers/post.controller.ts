import { Response } from 'express';
import { Op } from 'sequelize';
import { Post, Board, User, Like, Comment, Notification, Favorite, Tag, PostTag } from '../models';
import { success, fail } from '../utils/response';
import { AuthRequest } from '../middlewares/auth';
import { getPagination, paginatedResult } from '../utils/pagination';
import { sanitize, sanitizeText } from '../utils/sanitize';
import { pushNotification } from '../services/socketService';

// 浏览量防重复：基于 IP + postId 的内存缓存，1小时内同一IP重复访问不计数
const viewCache = new Map<string, number>(); // key: `${ip}:${postId}`, value: timestamp
const VIEW_CACHE_TTL = 60 * 60 * 1000; // 1小时

// 定期清理过期缓存（每10分钟）
setInterval(() => {
  const now = Date.now();
  for (const [key, ts] of viewCache) {
    if (now - ts > VIEW_CACHE_TTL) viewCache.delete(key);
  }
}, 10 * 60 * 1000);

export async function getPosts(req: AuthRequest, res: Response) {
  try {
    const { limit, offset, page, pageSize } = getPagination(req.query.page, req.query.pageSize);
    const { boardId, keyword, sort, authorId } = req.query;
    const where: any = { status: 'active' };
    if (boardId) where.board_id = parseInt(boardId as string);
    if (authorId) where.author_id = parseInt(authorId as string);
    if (keyword) where.title = { [Op.like]: `%${keyword}%` };

    const order: any[] = [['is_essential', 'DESC'], ['type', 'DESC']];
    if (sort === 'hot') order.push(['like_count', 'DESC']);
    order.push(['created_at', 'DESC']);

    const { count, rows } = await Post.findAndCountAll({
      where, include: [{ model: User, as: 'author', attributes: ['id', 'nickname', 'avatar_url', 'department'] }, { model: Board, as: 'board', attributes: ['id', 'name'] }],
      limit, offset, order, distinct: true,
    });

    // Check if current user liked each post
    const posts = rows.map(p => {
      const post = p.toJSON() as any;
      return post;
    });

    if (req.userId) {
      const postIds = rows.map(p => p.id);
      const likes = await Like.findAll({ where: { user_id: req.userId, post_id: { [Op.in]: postIds } } });
      const likedSet = new Set(likes.map(l => l.post_id));
      posts.forEach(p => p.isLiked = likedSet.has(p.id));
    }

    return success(res, paginatedResult(posts, count, page, pageSize));
  } catch (error: any) {
    return fail(res, error.message, 500);
  }
}

export async function getPost(req: AuthRequest, res: Response) {
  try {
    const post = await Post.findByPk(parseInt(req.params.id), {
      include: [
        { model: User, as: 'author', attributes: ['id', 'nickname', 'avatar_url', 'department'] },
        { model: Board, as: 'board', attributes: ['id', 'name'] },
        { model: Tag, as: 'tags' },
      ],
    });
    if (!post || post.status === 'deleted') return fail(res, '帖子不存在', 404);

    // 浏览量防重复：同一IP 1小时内重复访问不计数
    if (post.author_id !== req.userId) {
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const cacheKey = `${ip}:${post.id}`;
      const lastView = viewCache.get(cacheKey);
      if (!lastView || Date.now() - lastView > VIEW_CACHE_TTL) {
        await post.increment('view_count');
        viewCache.set(cacheKey, Date.now());
      }
    }

    const postData = post.toJSON() as any;
    if (req.userId) {
      const like = await Like.findOne({ where: { user_id: req.userId, post_id: post.id } });
      postData.isLiked = !!like;
      const fav = await Favorite.findOne({ where: { user_id: req.userId, post_id: post.id } });
      postData.isFavorited = !!fav;
    }

    return success(res, postData);
  } catch (error: any) {
    return fail(res, error.message, 500);
  }
}

export async function createPost(req: AuthRequest, res: Response) {
  try {
    const { title, content, boardId, type } = req.body;
    if (!title || !content || !boardId) return fail(res, '标题、内容和版块不能为空');

    const board = await Board.findByPk(boardId);
    if (!board) return fail(res, '版块不存在', 404);

    // XSS 净化
    const safeTitle = sanitizeText(title);
    const safeContent = sanitize(content);

    const post = await Post.create({
      title: safeTitle, content: safeContent, board_id: boardId, author_id: req.userId!, type: type || 'normal',
    });

    // 处理标签
    if (req.body.tags && Array.isArray(req.body.tags)) {
      for (const tagName of req.body.tags) {
        const [tag] = await Tag.findOrCreate({ where: { name: tagName.trim() }, defaults: { name: tagName.trim() } });
        await PostTag.findOrCreate({ where: { post_id: post.id, tag_id: tag.id } });
        await tag.increment('usage_count');
      }
    }

    await board.increment('post_count');
    const created = await Post.findByPk(post.id, {
      include: [
        { model: User, as: 'author', attributes: ['id', 'nickname', 'avatar_url'] },
        { model: Tag, as: 'tags' },
      ],
    });

    return success(res, created, '发帖成功', 201);
  } catch (error: any) {
    return fail(res, error.message, 500);
  }
}

export async function updatePost(req: AuthRequest, res: Response) {
  try {
    const post = await Post.findByPk(parseInt(req.params.id));
    if (!post) return fail(res, '帖子不存在', 404);

    if (post.author_id !== req.userId && req.userRole !== 'admin' && req.userRole !== 'moderator') {
      return fail(res, '无权编辑', 403);
    }

    const { title, content, type, tags } = req.body;
    if (title) post.title = sanitizeText(title);
    if (content) post.content = sanitize(content);
    if (type && (req.userRole === 'admin' || req.userRole === 'moderator')) post.type = type;
    await post.save();

    // 更新标签
    if (tags && Array.isArray(tags)) {
      // 递减旧标签的 usage_count
      const oldPostTags = await PostTag.findAll({ where: { post_id: post.id }, include: [{ model: Tag, as: 'tag' }] });
      for (const pt of oldPostTags) {
        const tagData = (pt as any).tag;
        if (tagData && tagData.usage_count > 0) {
          await tagData.decrement('usage_count');
        }
      }
      // 删除旧标签关联
      await PostTag.destroy({ where: { post_id: post.id } });
      // 创建新标签关联
      for (const tagName of tags) {
        const [tag] = await Tag.findOrCreate({ where: { name: tagName.trim() }, defaults: { name: tagName.trim() } });
        await PostTag.findOrCreate({ where: { post_id: post.id, tag_id: tag.id } });
        await tag.increment('usage_count');
      }
    }

    return success(res, post, '更新成功');
  } catch (error: any) {
    return fail(res, error.message, 500);
  }
}

export async function deletePost(req: AuthRequest, res: Response) {
  try {
    const post = await Post.findByPk(parseInt(req.params.id));
    if (!post) return fail(res, '帖子不存在', 404);

    if (post.author_id !== req.userId && req.userRole !== 'admin' && req.userRole !== 'moderator') {
      return fail(res, '无权删除', 403);
    }

    // 防止重复删除导致 post_count 重复递减
    if (post.status === 'deleted') return fail(res, '帖子已删除', 400);

    post.status = 'deleted';
    await post.save();
    await Board.decrement('post_count', { where: { id: post.board_id } });

    // 清理关联数据
    await Comment.update({ status: 'deleted' }, { where: { post_id: post.id } });
    await Like.destroy({ where: { post_id: post.id } });
    await Favorite.destroy({ where: { post_id: post.id } });
    await PostTag.destroy({ where: { post_id: post.id } });

    return success(res, null, '删除成功');
  } catch (error: any) {
    return fail(res, error.message, 500);
  }
}

export async function likePost(req: AuthRequest, res: Response) {
  try {
    const postId = parseInt(req.params.id);
    const post = await Post.findByPk(postId);
    if (!post) return fail(res, '帖子不存在', 404);

    const [like, created] = await Like.findOrCreate({ where: { user_id: req.userId!, post_id: postId } });
    if (!created) return fail(res, '已经点过赞了');

    await post.increment('like_count');

    // Create notification
    if (post.author_id !== req.userId) {
      const notif = await Notification.create({
        user_id: post.author_id, sender_id: req.userId,
        type: 'like', title: '有人赞了你的帖子',
        target_type: 'post', target_id: postId,
      });
      pushNotification(post.author_id, notif);
    }

    return success(res, null, '点赞成功');
  } catch (error: any) {
    return fail(res, error.message, 500);
  }
}

export async function unlikePost(req: AuthRequest, res: Response) {
  try {
    const postId = parseInt(req.params.id);
    const like = await Like.findOne({ where: { user_id: req.userId!, post_id: postId } });
    if (!like) return fail(res, '未点赞');

    await like.destroy();
    const post = await Post.findByPk(postId);
    if (post && post.like_count > 0) await post.decrement('like_count');

    return success(res, null, '取消点赞成功');
  } catch (error: any) {
    return fail(res, error.message, 500);
  }
}

export async function getLikeStatus(req: AuthRequest, res: Response) {
  try {
    const postId = parseInt(req.params.id);
    const like = await Like.findOne({ where: { user_id: req.userId!, post_id: postId } });
    return success(res, { isLiked: !!like });
  } catch (error: any) {
    return fail(res, error.message, 500);
  }
}

// ============ 收藏 ============
export async function favoritePost(req: AuthRequest, res: Response) {
  try {
    const postId = parseInt(req.params.id);
    const post = await Post.findByPk(postId);
    if (!post) return fail(res, '帖子不存在', 404);
    const [fav, created] = await Favorite.findOrCreate({ where: { user_id: req.userId!, post_id: postId } });
    if (!created) return fail(res, '已收藏过');
    return success(res, null, '收藏成功', 201);
  } catch (error: any) { return fail(res, error.message, 500); }
}

export async function unfavoritePost(req: AuthRequest, res: Response) {
  try {
    const postId = parseInt(req.params.id);
    const fav = await Favorite.findOne({ where: { user_id: req.userId!, post_id: postId } });
    if (!fav) return fail(res, '未收藏');
    await fav.destroy();
    return success(res, null, '取消收藏成功');
  } catch (error: any) { return fail(res, error.message, 500); }
}

export async function getUserFavorites(req: AuthRequest, res: Response) {
  try {
    const { limit, offset, page, pageSize } = getPagination(req.query.page, req.query.pageSize);
    const { count, rows } = await Favorite.findAndCountAll({
      where: { user_id: req.userId! },
      include: [{ model: Post, as: 'post', include: [{ model: User, as: 'author', attributes: ['id', 'nickname', 'avatar_url'] }, { model: Board, as: 'board', attributes: ['id', 'name'] }], where: { status: 'active' } }],
      limit, offset, order: [['created_at', 'DESC']],
    });
    const list = rows.map(r => r.post!.toJSON());
    return success(res, paginatedResult(list, count, page, pageSize));
  } catch (error: any) { return fail(res, error.message, 500); }
}

// ============ 置顶/精华 ============
export async function togglePin(req: AuthRequest, res: Response) {
  try {
    const post = await Post.findByPk(parseInt(req.params.id));
    if (!post) return fail(res, '帖子不存在', 404);
    // announcement 类型不可置顶/取消置顶
    if (post.type === 'announcement') return fail(res, '公告类型无需置顶', 400);
    post.type = post.type === 'pinned' ? 'normal' : 'pinned';
    await post.save();
    return success(res, { is_pinned: post.type === 'pinned' }, post.type === 'pinned' ? '已置顶' : '已取消置顶');
  } catch (error: any) { return fail(res, error.message, 500); }
}

export async function toggleEssential(req: AuthRequest, res: Response) {
  try {
    const post = await Post.findByPk(parseInt(req.params.id));
    if (!post) return fail(res, '帖子不存在', 404);
    post.is_essential = !post.is_essential;
    await post.save();
    return success(res, { is_essential: post.is_essential }, post.is_essential ? '已标为精华' : '已取消精华');
  } catch (error: any) { return fail(res, error.message, 500); }
}
