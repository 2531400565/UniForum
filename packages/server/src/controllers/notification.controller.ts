import { Response } from 'express';
import { Notification, User } from '../models';
import { success, fail } from '../utils/response';
import { AuthRequest } from '../middlewares/auth';
import { getPagination, paginatedResult } from '../utils/pagination';

export async function getNotifications(req: AuthRequest, res: Response) {
  try {
    const { limit, offset, page, pageSize } = getPagination(req.query.page, req.query.pageSize);
    const { count, rows } = await Notification.findAndCountAll({
      where: { user_id: req.userId! },
      include: [{ model: User, as: 'sender', attributes: ['id', 'nickname', 'avatar_url'] }],
      limit, offset, order: [['created_at', 'DESC']],
    });
    return success(res, paginatedResult(rows, count, page, pageSize));
  } catch (error: any) { return fail(res, error.message, 500); }
}

export async function markRead(req: AuthRequest, res: Response) {
  try {
    const n = await Notification.findOne({ where: { id: parseInt(req.params.id), user_id: req.userId! } });
    if (!n) return fail(res, '通知不存在', 404);
    n.is_read = true;
    await n.save();
    return success(res, null, '已标记已读');
  } catch (error: any) { return fail(res, error.message, 500); }
}

export async function markAllRead(req: AuthRequest, res: Response) {
  try {
    await Notification.update({ is_read: true }, { where: { user_id: req.userId!, is_read: false } });
    return success(res, null, '全部已读');
  } catch (error: any) { return fail(res, error.message, 500); }
}

export async function getUnreadCount(req: AuthRequest, res: Response) {
  try {
    const count = await Notification.count({ where: { user_id: req.userId!, is_read: false } });
    return success(res, { count });
  } catch (error: any) { return fail(res, error.message, 500); }
}
