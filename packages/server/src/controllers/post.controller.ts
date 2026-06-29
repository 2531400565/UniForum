import { Response } from 'express';
import { Op } from 'sequelize';
import { Post, Board, User, Like, Comment, Notification } from '../models';
import { success, fail } from '../utils/response';
import { AuthRequest } from '../middlewares/auth';
import { getPagination, paginatedResult } from '../utils/pagination';

export async function getPosts(req: AuthRequest, res: Response) {
  try {
    const { limit, offset, page, pageSize } = getPagination(req.query.page, req.query.pageSize);
    const { boardId, keyword, sort } = req.query;
    const where: any = { status: 'active' };
    if (boardId) where.board_id = parseInt(boardId as string);
    if (keyword) where.title = { [Op.like]: `%${keyword}%` };

    const order: any[] = [['type', 'DESC']];
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
      ],
    });
    if (!post || post.status === 'deleted') return fail(res, '帖子不存在', 404);

    // Increment view count
    await post.increment('view_count');

    const postData = post.toJSON() as any;
    if (req.userId) {
      const like = await Like.findOne({ where: { user_id: req.userId, post_id: post.id } });
      postData.isLiked = !!like;
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

    const post = await Post.create({
      title, content, board_id: boardId, author_id: req.userId!, type: type || 'normal',
    });

    await board.increment('post_count');
    const created = await Post.findByPk(post.id, {
      include: [{ model: User, as: 'author', attributes: ['id', 'nickname', 'avatar_url'] }],
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

    const { title, content, type } = req.body;
    if (title) post.title = title;
    if (content) post.content = content;
    if (type && (req.userRole === 'admin' || req.userRole === 'moderator')) post.type = type;
    await post.save();

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

    post.status = 'deleted';
    await post.save();
    await Board.decrement('post_count', { where: { id: post.board_id } });

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
      await Notification.create({
        user_id: post.author_id, sender_id: req.userId,
        type: 'like', title: '有人赞了你的帖子',
        target_type: 'post', target_id: postId,
      });
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
