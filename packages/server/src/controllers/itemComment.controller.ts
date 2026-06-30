import { Response } from 'express';
import { ItemComment, User, Notification, MarketItem, LostAndFound } from '../models';
import { success, fail } from '../utils/response';
import { AuthRequest } from '../middlewares/auth';
import { getPagination, paginatedResult } from '../utils/pagination';
import { sanitizeText } from '../utils/sanitize';
import { pushNotification } from '../services/socketService';

export async function getComments(req: AuthRequest, res: Response) {
  try {
    const { targetType, targetId } = req.params;
    if (!['marketplace', 'lost_found'].includes(targetType)) {
      return fail(res, '无效的目标类型', 400);
    }
    const { limit, offset, page, pageSize } = getPagination(req.query.page, req.query.pageSize);

    const { count, rows } = await ItemComment.findAndCountAll({
      where: { target_type: targetType, target_id: parseInt(targetId), status: 'active', parent_id: null },
      include: [
        { model: User, as: 'author', attributes: ['id', 'nickname', 'avatar_url'] },
        {
          model: ItemComment, as: 'replies',
          include: [
            { model: User, as: 'author', attributes: ['id', 'nickname', 'avatar_url'] },
            { model: User, as: 'replyTo', attributes: ['id', 'nickname'] },
          ],
          where: { status: 'active' },
          required: false,
        },
      ],
      limit, offset, order: [['created_at', 'ASC']],
    });

    return success(res, paginatedResult(rows, count, page, pageSize));
  } catch (error: any) {
    return fail(res, error.message, 500);
  }
}

export async function createComment(req: AuthRequest, res: Response) {
  try {
    const { targetType, targetId } = req.params;
    if (!['marketplace', 'lost_found'].includes(targetType)) {
      return fail(res, '无效的目标类型', 400);
    }
    const { content, parentId, replyToId } = req.body;
    if (!content) return fail(res, '评论内容不能为空');

    const comment = await ItemComment.create({
      content: sanitizeText(content),
      target_type: targetType as 'marketplace' | 'lost_found',
      target_id: parseInt(targetId),
      author_id: req.userId!,
      parent_id: parentId || null,
      reply_to_id: replyToId || null,
    });

    // 查询完整的评论数据
    const fullComment = await ItemComment.findByPk(comment.id, {
      include: [
        { model: User, as: 'author', attributes: ['id', 'nickname', 'avatar_url'] },
        { model: User, as: 'replyTo', attributes: ['id', 'nickname'] },
      ],
    });

    // 通知逻辑
    let notifyUserId: number | undefined;
    const targetTypeName = targetType === 'marketplace' ? '二手市场' : '失物招领';

    if (replyToId) {
      // 回复指定用户
      notifyUserId = replyToId;
    } else if (parentId) {
      // 回复评论但未指定 replyToId，通知父评论作者
      const parent = await ItemComment.findByPk(parentId);
      notifyUserId = parent?.author_id;
    }
    if (!notifyUserId) {
      // 通知商品/失物招领的发布者
      if (targetType === 'marketplace') {
        const item = await MarketItem.findByPk(parseInt(targetId));
        notifyUserId = item?.seller_id;
      } else {
        const item = await LostAndFound.findByPk(parseInt(targetId));
        notifyUserId = item?.author_id;
      }
    }

    if (notifyUserId && notifyUserId !== req.userId) {
      const notif = await Notification.create({
        user_id: notifyUserId, sender_id: req.userId,
        type: parentId ? 'reply' : 'comment',
        title: parentId ? '有人回复了你的评论' : `有人在${targetTypeName}评论了`,
        target_type: targetType, target_id: parseInt(targetId),
      });
      pushNotification(notifyUserId, notif);
    }

    return success(res, fullComment, '评论成功', 201);
  } catch (error: any) {
    return fail(res, error.message, 500);
  }
}

export async function deleteComment(req: AuthRequest, res: Response) {
  try {
    const comment = await ItemComment.findByPk(parseInt(req.params.id));
    if (!comment) return fail(res, '评论不存在', 404);
    if (comment.author_id !== req.userId && req.userRole !== 'admin') {
      return fail(res, '无权删除', 403);
    }
    comment.status = 'deleted';
    await comment.save();
    return success(res, null, '删除成功');
  } catch (error: any) {
    return fail(res, error.message, 500);
  }
}
