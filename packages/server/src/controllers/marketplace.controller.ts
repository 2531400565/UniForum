import { Response } from 'express';
import { Op } from 'sequelize';
import { MarketItem, User } from '../models';
import { success, fail } from '../utils/response';
import { AuthRequest } from '../middlewares/auth';
import { getPagination, paginatedResult } from '../utils/pagination';

export async function getList(req: AuthRequest, res: Response) {
  try {
    const { limit, offset, page, pageSize } = getPagination(req.query.page, req.query.pageSize);
    const { category, status, minPrice, maxPrice, keyword } = req.query;
    const where: any = {};
    if (!status || status === 'all') {
      where.status = { [Op.in]: ['selling', 'sold'] };
    } else {
      where.status = status;
    }
    if (category) where.category = category;
    if (keyword) where.title = { [Op.like]: `%${keyword}%` };
    if (minPrice) where.price = { ...where.price, [Op.gte]: parseFloat(minPrice as string) };
    if (maxPrice) where.price = { ...where.price, [Op.lte]: parseFloat(maxPrice as string) };
    const { count, rows } = await MarketItem.findAndCountAll({
      where, include: [{ model: User, as: 'seller', attributes: ['id', 'nickname', 'avatar_url'] }],
      limit, offset, order: [['created_at', 'DESC']],
    });
    return success(res, paginatedResult(rows, count, page, pageSize));
  } catch (error: any) { return fail(res, error.message, 500); }
}

export async function getDetail(req: AuthRequest, res: Response) {
  try {
    const item = await MarketItem.findByPk(parseInt(req.params.id), { include: [{ model: User, as: 'seller', attributes: ['id', 'nickname', 'avatar_url'] }] });
    if (!item) return fail(res, '商品不存在', 404);
    return success(res, item);
  } catch (error: any) { return fail(res, error.message, 500); }
}

export async function create(req: AuthRequest, res: Response) {
  try {
    const { title, description, price, originalPrice, conditionLevel, category, images, contactInfo } = req.body;
    if (!title || !description || !price || !conditionLevel || !category) return fail(res, '必填字段不能为空');
    const item = await MarketItem.create({
      title, description, price, original_price: originalPrice || null,
      condition_level: conditionLevel, category,
      images: images ? JSON.stringify(images) : null,
      contact_info: contactInfo || null, seller_id: req.userId!,
    });
    return success(res, item, '发布成功', 201);
  } catch (error: any) { return fail(res, error.message, 500); }
}

export async function update(req: AuthRequest, res: Response) {
  try {
    const item = await MarketItem.findByPk(parseInt(req.params.id));
    if (!item) return fail(res, '商品不存在', 404);
    if (item.seller_id !== req.userId && req.userRole !== 'admin') return fail(res, '无权修改', 403);
    const { title, description, price, originalPrice, conditionLevel, category, images, contactInfo } = req.body;
    if (title) item.title = title;
    if (description) item.description = description;
    if (price) item.price = price;
    if (originalPrice !== undefined) item.original_price = originalPrice;
    if (conditionLevel) item.condition_level = conditionLevel;
    if (category) item.category = category;
    if (images) item.images = JSON.stringify(images);
    if (contactInfo !== undefined) item.contact_info = contactInfo;
    await item.save();
    return success(res, item, '更新成功');
  } catch (error: any) { return fail(res, error.message, 500); }
}

export async function updateStatus(req: AuthRequest, res: Response) {
  try {
    const item = await MarketItem.findByPk(parseInt(req.params.id));
    if (!item) return fail(res, '商品不存在', 404);
    if (item.seller_id !== req.userId && req.userRole !== 'admin') return fail(res, '无权修改', 403);
    const { status } = req.body;
    if (!['selling', 'reserved', 'sold', 'removed'].includes(status)) return fail(res, '无效状态');
    item.status = status;
    await item.save();
    return success(res, item, '状态更新成功');
  } catch (error: any) { return fail(res, error.message, 500); }
}

export async function remove(req: AuthRequest, res: Response) {
  try {
    const item = await MarketItem.findByPk(parseInt(req.params.id));
    if (!item) return fail(res, '商品不存在', 404);
    if (item.seller_id !== req.userId && req.userRole !== 'admin') return fail(res, '无权删除', 403);
    await item.destroy();
    return success(res, null, '删除成功');
  } catch (error: any) { return fail(res, error.message, 500); }
}
