import { Response } from 'express';
import { Op } from 'sequelize';
import { Announcement, User } from '../models';
import { success, fail } from '../utils/response';
import { AuthRequest } from '../middlewares/auth';
import { getPagination, paginatedResult } from '../utils/pagination';

export async function getAnnouncements(req: AuthRequest, res: Response) {
  try {
    const { limit, offset, page, pageSize } = getPagination(req.query.page, req.query.pageSize);
    const { type } = req.query;
    const where: any = {};
    if (req.query.showAll === 'true') {
      // admin can see all statuses
    } else {
      where.status = 'active';
    }
    if (type) where.type = type;
    const { count, rows } = await Announcement.findAndCountAll({
      where, include: [{ model: User, as: 'publisher', attributes: ['id', 'nickname'] }],
      limit, offset, order: [['priority', 'DESC'], ['created_at', 'DESC']],
    });
    return success(res, paginatedResult(rows, count, page, pageSize));
  } catch (error: any) { return fail(res, error.message, 500); }
}

export async function getAnnouncement(req: AuthRequest, res: Response) {
  try {
    const a = await Announcement.findByPk(parseInt(req.params.id), { include: [{ model: User, as: 'publisher', attributes: ['id', 'nickname'] }] });
    if (!a) return fail(res, '公告不存在', 404);
    return success(res, a);
  } catch (error: any) { return fail(res, error.message, 500); }
}

export async function createAnnouncement(req: AuthRequest, res: Response) {
  try {
    const { title, content, type, priority, startDate, endDate } = req.body;
    if (!title || !content || !type) return fail(res, '标题、内容和类型不能为空');
    const a = await Announcement.create({ title, content, type, publisher_id: req.userId!, priority: priority || 0, start_date: startDate || null, end_date: endDate || null });
    return success(res, a, '发布成功', 201);
  } catch (error: any) { return fail(res, error.message, 500); }
}

export async function updateAnnouncement(req: AuthRequest, res: Response) {
  try {
    const a = await Announcement.findByPk(parseInt(req.params.id));
    if (!a) return fail(res, '公告不存在', 404);
    const { title, content, type, priority, startDate, endDate, status } = req.body;
    if (title) a.title = title;
    if (content) a.content = content;
    if (type) a.type = type;
    if (priority !== undefined) a.priority = priority;
    if (startDate !== undefined) a.start_date = startDate;
    if (endDate !== undefined) a.end_date = endDate;
    if (status) a.status = status;
    await a.save();
    return success(res, a, '更新成功');
  } catch (error: any) { return fail(res, error.message, 500); }
}

export async function deleteAnnouncement(req: AuthRequest, res: Response) {
  try {
    const a = await Announcement.findByPk(parseInt(req.params.id));
    if (!a) return fail(res, '公告不存在', 404);
    a.status = 'deleted';
    await a.save();
    return success(res, null, '删除成功');
  } catch (error: any) { return fail(res, error.message, 500); }
}
