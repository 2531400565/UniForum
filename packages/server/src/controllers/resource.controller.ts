import { Response } from 'express';
import { Op } from 'sequelize';
import path from 'path';
import { Resource, ResourceDownload, User } from '../models';
import { success, fail } from '../utils/response';
import { AuthRequest } from '../middlewares/auth';
import { getPagination, paginatedResult } from '../utils/pagination';

export async function getResources(req: AuthRequest, res: Response) {
  try {
    const { limit, offset, page, pageSize } = getPagination(req.query.page, req.query.pageSize);
    const { category, subject, keyword, status, uploaderId } = req.query;
    const where: any = {};
    if (status) where.status = status;
    else where.status = 'active';
    if (category) where.category = category;
    if (subject) where.subject = subject;
    if (uploaderId) where.uploader_id = parseInt(uploaderId as string);
    if (keyword) where[Op.or] = [{ title: { [Op.like]: `%${keyword}%` } }, { description: { [Op.like]: `%${keyword}%` } }];
    const { count, rows } = await Resource.findAndCountAll({
      where, include: [{ model: User, as: 'uploader', attributes: ['id', 'nickname', 'avatar_url'] }],
      limit, offset, order: [['created_at', 'DESC']],
    });
    return success(res, paginatedResult(rows, count, page, pageSize));
  } catch (error: any) { return fail(res, error.message, 500); }
}

export async function getResource(req: AuthRequest, res: Response) {
  try {
    const r = await Resource.findByPk(parseInt(req.params.id), { include: [{ model: User, as: 'uploader', attributes: ['id', 'nickname', 'avatar_url'] }] });
    if (!r) return fail(res, '资源不存在', 404);
    return success(res, r);
  } catch (error: any) { return fail(res, error.message, 500); }
}

export async function uploadResource(req: AuthRequest, res: Response) {
  try {
    if (!req.file) return fail(res, '请上传文件');
    const { title, description, category, subject } = req.body;
    if (!title || !category) return fail(res, '标题和分类不能为空');
    // 修复 multer originalname Latin-1 编码问题，转为 UTF-8
    const fileName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
    const r = await Resource.create({
      title, description: description || null, category, subject: subject || null,
      file_url: `/uploads/resources/${req.file.filename}`,
      file_name: fileName, file_size: req.file.size,
      file_type: path.extname(fileName).replace('.', ''),
      uploader_id: req.userId!,
    });
    return success(res, r, '上传成功，等待审核', 201);
  } catch (error: any) { return fail(res, error.message, 500); }
}

export async function downloadResource(req: AuthRequest, res: Response) {
  try {
    const r = await Resource.findByPk(parseInt(req.params.id));
    if (!r || r.status !== 'active') return fail(res, '资源不存在', 404);

    const filePath = path.join(path.resolve(__dirname, '../..'), r.file_url.replace(/^\//, ''));
    if (!require('fs').existsSync(filePath)) return fail(res, '文件不存在', 404);

    // 先递增下载计数和记录下载，再发送文件
    await r.increment('download_count');
    await ResourceDownload.findOrCreate({ where: { resource_id: r.id, user_id: req.userId! } });

    // 手动设置 Content-Disposition，正确处理中文文件名 (RFC 5987)
    const encodedName = encodeURIComponent(r.file_name).replace(/['()]/g, escape).replace(/\*/g, '%2A');
    res.setHeader('Content-Disposition', `attachment; filename="${encodedName}"; filename*=UTF-8''${encodedName}`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.sendFile(filePath, (err) => {
      if (err) console.error('下载失败:', err.message);
    });
  } catch (error: any) { return fail(res, error.message, 500); }
}

export async function rateResource(req: AuthRequest, res: Response) {
  try {
    const resourceId = parseInt(req.params.id);
    const { rating, review } = req.body;
    if (!rating || rating < 1 || rating > 5) return fail(res, '评分为1-5');

    // 必须先下载才能评分
    const download = await ResourceDownload.findOne({ where: { resource_id: resourceId, user_id: req.userId! } });
    if (!download) return fail(res, '请先下载资源后再评分', 403);
    download.rating = rating;
    download.review = review || null;
    await download.save();

    // Recalculate avg rating
    const downloads = await ResourceDownload.findAll({ where: { resource_id: resourceId, rating: { [Op.ne]: null } } });
    const avg = downloads.reduce((sum, d) => sum + (d.rating || 0), 0) / downloads.length;
    await Resource.update({ avg_rating: Math.round(avg * 10) / 10, rating_count: downloads.length }, { where: { id: resourceId } });

    return success(res, null, '评分成功');
  } catch (error: any) { return fail(res, error.message, 500); }
}

export async function getRatings(req: AuthRequest, res: Response) {
  try {
    const { limit, offset, page, pageSize } = getPagination(req.query.page, req.query.pageSize);
    const { count, rows } = await ResourceDownload.findAndCountAll({
      where: { resource_id: parseInt(req.params.id), rating: { [Op.ne]: null } },
      include: [{ model: User, as: 'user', attributes: ['id', 'nickname', 'avatar_url'] }],
      limit, offset, order: [['created_at', 'DESC']],
    });
    return success(res, paginatedResult(rows, count, page, pageSize));
  } catch (error: any) { return fail(res, error.message, 500); }
}

export async function updateResourceStatus(req: AuthRequest, res: Response) {
  try {
    const r = await Resource.findByPk(parseInt(req.params.id));
    if (!r) return fail(res, '资源不存在', 404);
    const { status } = req.body;
    if (!['active', 'pending', 'rejected', 'deleted'].includes(status)) return fail(res, '无效状态');
    r.status = status;
    await r.save();
    return success(res, r, '状态更新成功');
  } catch (error: any) { return fail(res, error.message, 500); }
}

export async function deleteResource(req: AuthRequest, res: Response) {
  try {
    const r = await Resource.findByPk(parseInt(req.params.id));
    if (!r) return fail(res, '资源不存在', 404);
    if (r.uploader_id !== req.userId && req.userRole !== 'admin') return fail(res, '无权删除', 403);
    await r.destroy();
    return success(res, null, '删除成功');
  } catch (error: any) { return fail(res, error.message, 500); }
}
