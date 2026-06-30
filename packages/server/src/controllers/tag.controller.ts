import { Response } from 'express';
import { Tag, PostTag, Post } from '../models';
import { success, fail } from '../utils/response';
import { AuthRequest } from '../middlewares/auth';

export async function getTags(req: AuthRequest, res: Response) {
  try {
    const tags = await Tag.findAll({ order: [['usage_count', 'DESC']], limit: 50 });
    return success(res, tags);
  } catch (error: any) {
    return fail(res, error.message, 500);
  }
}

export async function searchTags(req: AuthRequest, res: Response) {
  try {
    const { keyword } = req.query;
    const { Op } = require('sequelize');
    const where: any = {};
    if (keyword) where.name = { [Op.like]: `%${keyword}%` };
    const tags = await Tag.findAll({ where, order: [['usage_count', 'DESC']], limit: 20 });
    return success(res, tags);
  } catch (error: any) {
    return fail(res, error.message, 500);
  }
}

export async function createTag(req: AuthRequest, res: Response) {
  try {
    const { name, color } = req.body;
    if (!name) return fail(res, '标签名不能为空');
    const [tag, created] = await Tag.findOrCreate({ where: { name: name.trim() }, defaults: { color: color || 'default' } });
    if (!created) return success(res, tag, '标签已存在');
    return success(res, tag, '创建成功', 201);
  } catch (error: any) {
    return fail(res, error.message, 500);
  }
}

export async function getPostTags(req: AuthRequest, res: Response) {
  try {
    const postId = parseInt(req.params.postId);
    const postTags = await PostTag.findAll({
      where: { post_id: postId },
      include: [{ model: Tag, as: 'tag' }],
    });
    const tags = postTags.map((pt: any) => pt.tag);
    return success(res, tags);
  } catch (error: any) {
    return fail(res, error.message, 500);
  }
}

export async function getPostsByTag(req: AuthRequest, res: Response) {
  try {
    const tagId = parseInt(req.params.tagId);
    const { limit, offset } = require('../utils/pagination').getPagination(req.query.page, req.query.pageSize);
    const postTags = await PostTag.findAndCountAll({
      where: { tag_id: tagId },
      include: [{ model: Post, as: 'post', where: { status: 'active' } }],
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });
    const posts = postTags.rows.map((pt: any) => pt.post);
    return success(res, { list: posts, total: postTags.count });
  } catch (error: any) {
    return fail(res, error.message, 500);
  }
}
