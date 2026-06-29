import { Response } from 'express';
import { Op } from 'sequelize';
import { LostAndFound, User } from '../models';
import { success, fail } from '../utils/response';
import { AuthRequest } from '../middlewares/auth';
import { getPagination, paginatedResult } from '../utils/pagination';

export async function getList(req: AuthRequest, res: Response) {
  try {
    const { limit, offset, page, pageSize } = getPagination(req.query.page, req.query.pageSize);
    const { type, status, keyword } = req.query;
    const where: any = { status: status || 'open' };
    if (type) where.type = type;
    if (keyword) where.title = { [Op.like]: `%${keyword}%` };
    const { count, rows } = await LostAndFound.findAndCountAll({
      where, include: [{ model: User, as: 'author', attributes: ['id', 'nickname', 'avatar_url'] }],
      limit, offset, order: [['created_at', 'DESC']],
    });
    return success(res, paginatedResult(rows, count, page, pageSize));
  } catch (error: any) { return fail(res, error.message, 500); }
}

export async function getDetail(req: AuthRequest, res: Response) {
  try {
    const item = await LostAndFound.findByPk(parseInt(req.params.id), { include: [{ model: User, as: 'author', attributes: ['id', 'nickname', 'avatar_url'] }] });
    if (!item) return fail(res, '记录不存在', 404);
    return success(res, item);
  } catch (error: any) { return fail(res, error.message, 500); }
}

export async function create(req: AuthRequest, res: Response) {
  try {
    const { title, description, type, itemCategory, location, lostTime, images, contactInfo } = req.body;
    if (!title || !description || !type || !itemCategory) return fail(res, '必填字段不能为空');
    const item = await LostAndFound.create({
      title, description, type, item_category: itemCategory,
      location: location || null, lost_time: lostTime || null,
      images: images ? JSON.stringify(images) : null,
      contact_info: contactInfo || null, author_id: req.userId!,
    });
    return success(res, item, '发布成功', 201);
  } catch (error: any) { return fail(res, error.message, 500); }
}

export async function update(req: AuthRequest, res: Response) {
  try {
    const item = await LostAndFound.findByPk(parseInt(req.params.id));
    if (!item) return fail(res, '记录不存在', 404);
    if (item.author_id !== req.userId && req.userRole !== 'admin') return fail(res, '无权修改', 403);
    const { title, description, location, contactInfo, images } = req.body;
    if (title) item.title = title;
    if (description) item.description = description;
    if (location !== undefined) item.location = location;
    if (contactInfo !== undefined) item.contact_info = contactInfo;
    if (images) item.images = JSON.stringify(images);
    await item.save();
    return success(res, item, '更新成功');
  } catch (error: any) { return fail(res, error.message, 500); }
}

export async function updateStatus(req: AuthRequest, res: Response) {
  try {
    const item = await LostAndFound.findByPk(parseInt(req.params.id));
    if (!item) return fail(res, '记录不存在', 404);
    if (item.author_id !== req.userId && req.userRole !== 'admin') return fail(res, '无权修改', 403);
    const { status } = req.body;
    if (!['open', 'resolved', 'closed'].includes(status)) return fail(res, '无效状态');
    item.status = status;
    await item.save();
    return success(res, item, '状态更新成功');
  } catch (error: any) { return fail(res, error.message, 500); }
}

export async function remove(req: AuthRequest, res: Response) {
  try {
    const item = await LostAndFound.findByPk(parseInt(req.params.id));
    if (!item) return fail(res, '记录不存在', 404);
    if (item.author_id !== req.userId && req.userRole !== 'admin') return fail(res, '无权删除', 403);
    await item.destroy();
    return success(res, null, '删除成功');
  } catch (error: any) { return fail(res, error.message, 500); }
}
