import { Response } from 'express';
import { Board, User, Post } from '../models';
import { success, fail } from '../utils/response';
import { AuthRequest } from '../middlewares/auth';

export async function getBoards(req: AuthRequest, res: Response) {
  try {
    const boards = await Board.findAll({ include: [{ model: User, as: 'creator', attributes: ['id', 'nickname'] }], order: [['sort_order', 'DESC'], ['created_at', 'DESC']] });
    return success(res, boards);
  } catch (error: any) {
    return fail(res, error.message, 500);
  }
}

export async function getBoard(req: AuthRequest, res: Response) {
  try {
    const board = await Board.findByPk(parseInt(req.params.id), { include: [{ model: User, as: 'creator', attributes: ['id', 'nickname'] }] });
    if (!board) return fail(res, '版块不存在', 404);
    return success(res, board);
  } catch (error: any) {
    return fail(res, error.message, 500);
  }
}

export async function createBoard(req: AuthRequest, res: Response) {
  try {
    const { name, description, icon, category, sortOrder } = req.body;
    if (!name || !category) return fail(res, '名称和分类不能为空');
    const board = await Board.create({ name, description: description || null, icon: icon || null, category, sort_order: sortOrder || 0, created_by: req.userId! });
    return success(res, board, '创建成功', 201);
  } catch (error: any) {
    return fail(res, error.message, 500);
  }
}

export async function updateBoard(req: AuthRequest, res: Response) {
  try {
    const board = await Board.findByPk(parseInt(req.params.id));
    if (!board) return fail(res, '版块不存在', 404);
    const { name, description, icon, category, sortOrder } = req.body;
    if (name) board.name = name;
    if (description !== undefined) board.description = description;
    if (icon !== undefined) board.icon = icon;
    if (category) board.category = category;
    if (sortOrder !== undefined) board.sort_order = sortOrder;
    await board.save();
    return success(res, board, '更新成功');
  } catch (error: any) {
    return fail(res, error.message, 500);
  }
}

export async function deleteBoard(req: AuthRequest, res: Response) {
  try {
    const board = await Board.findByPk(parseInt(req.params.id));
    if (!board) return fail(res, '版块不存在', 404);
    const postCount = await Post.count({ where: { board_id: board.id, status: 'active' } });
    if (postCount > 0) return fail(res, `版块下还有 ${postCount} 个帖子，无法删除`, 400);
    await board.destroy();
    return success(res, null, '删除成功');
  } catch (error: any) {
    return fail(res, error.message, 500);
  }
}
