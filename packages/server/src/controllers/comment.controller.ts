import { Response } from 'express';
import { Comment, User, Post, Notification, CommentLike } from '../models';
import { Op } from 'sequelize';
import { success, fail } from '../utils/response';
import { AuthRequest } from '../middlewares/auth';
import { getPagination, paginatedResult } from '../utils/pagination';

export async function getComments(req: AuthRequest, res: Response) {
  try {
    const postId = parseInt(req.params.postId);
    const { limit, offset, page, pageSize } = getPagination(req.query.page, req.query.pageSize);

    const { count, rows } = await Comment.findAndCountAll({
      where: { post_id: postId, status: 'active', parent_id: null },
      include: [
        { model: User, as: 'author', attributes: ['id', 'nickname', 'avatar_url'] },
        { model: Comment, as: 'replies', include: [{ model: User, as: 'author', attributes: ['id', 'nickname', 'avatar_url'] }, { model: User, as: 'replyTo', attributes: ['id', 'nickname'] }], where: { status: 'active' }, required: false },
      ],
      limit, offset, order: [['created_at', 'ASC']],
    });

    // Check if current user liked each comment
    const commentIds = rows.flatMap(c => [c.id, ...c.replies.map((r: any) => r.id)]);
    const likedIds = req.userId ? new Set((await CommentLike.findAll({ where: { user_id: req.userId, comment_id: { [Op.in]: commentIds } } })).map(l => l.comment_id)) : new Set<number>();
    const data = paginatedResult(rows.map(c => {
      const comment = c.toJSON() as any;
      comment.isLiked = likedIds.has(comment.id);
      comment.replies = (comment.replies || []).map((r: any) => ({ ...r, isLiked: likedIds.has(r.id) }));
      return comment;
    }), count, page, pageSize);

    return success(res, data);
  } catch (error: any) {
    return fail(res, error.message, 500);
  }
}

export async function createComment(req: AuthRequest, res: Response) {
  try {
    const postId = parseInt(req.params.postId);
    const post = await Post.findByPk(postId);
    if (!post) return fail(res, '帖子不存在', 404);

    const { content, parentId, replyToId } = req.body;
    if (!content) return fail(res, '评论内容不能为空');

    const comment = await Comment.create({
      content, post_id: postId, author_id: req.userId!,
      parent_id: parentId || null, reply_to_id: replyToId || null,
    });

    await post.increment('comment_count');

    const created = await Comment.findByPk(comment.id, {
      include: [{ model: User, as: 'author', attributes: ['id', 'nickname', 'avatar_url'] }],
    });

    // Notification
    const notifyUserId = replyToId || post.author_id;
    if (notifyUserId !== req.userId) {
      await Notification.create({
        user_id: notifyUserId, sender_id: req.userId,
        type: parentId ? 'reply' : 'comment',
        title: parentId ? '有人回复了你的评论' : '有人评论了你的帖子',
        target_type: 'post', target_id: postId,
      });
    }

    return success(res, created, '评论成功', 201);
  } catch (error: any) {
    return fail(res, error.message, 500);
  }
}

export async function deleteComment(req: AuthRequest, res: Response) {
  try {
    const comment = await Comment.findByPk(parseInt(req.params.id));
    if (!comment) return fail(res, '评论不存在', 404);

    if (comment.author_id !== req.userId && req.userRole !== 'admin' && req.userRole !== 'moderator') {
      return fail(res, '无权删除', 403);
    }

    comment.status = 'deleted';
    await comment.save();

    const post = await Post.findByPk(comment.post_id);
    if (post && post.comment_count > 0) await post.decrement('comment_count');

    return success(res, null, '删除成功');
  } catch (error: any) {
    return fail(res, error.message, 500);
  }
}

export async function likeComment(req: AuthRequest, res: Response) {
  try {
    const commentId = parseInt(req.params.id);
    const comment = await Comment.findByPk(commentId);
    if (!comment || comment.status === 'deleted') return fail(res, '评论不存在', 404);

    const [like, created] = await CommentLike.findOrCreate({ where: { user_id: req.userId!, comment_id: commentId } });
    if (!created) return fail(res, '已点赞过');

    await comment.increment('like_count');
    return success(res, null, '点赞成功', 201);
  } catch (error: any) { return fail(res, error.message, 500); }
}

export async function unlikeComment(req: AuthRequest, res: Response) {
  try {
    const commentId = parseInt(req.params.id);
    const like = await CommentLike.findOne({ where: { user_id: req.userId!, comment_id: commentId } });
    if (!like) return fail(res, '未点赞');

    await like.destroy();
    const comment = await Comment.findByPk(commentId);
    if (comment && comment.like_count > 0) await comment.decrement('like_count');

    return success(res, null, '取消点赞成功');
  } catch (error: any) { return fail(res, error.message, 500); }
}
