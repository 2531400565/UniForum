import { Response } from 'express';
import { Op } from 'sequelize';
import { Question, Answer, User, Notification } from '../models';
import { success, fail } from '../utils/response';
import { AuthRequest } from '../middlewares/auth';
import { getPagination, paginatedResult } from '../utils/pagination';

export async function getQuestions(req: AuthRequest, res: Response) {
  try {
    const { limit, offset, page, pageSize } = getPagination(req.query.page, req.query.pageSize);
    const { category, status, keyword } = req.query;
    const where: any = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (keyword) where.title = { [Op.like]: `%${keyword}%` };
    const { count, rows } = await Question.findAndCountAll({
      where, include: [{ model: User, as: 'author', attributes: ['id', 'nickname', 'avatar_url'] }],
      limit, offset, order: [['created_at', 'DESC']],
    });
    return success(res, paginatedResult(rows, count, page, pageSize));
  } catch (error: any) { return fail(res, error.message, 500); }
}

export async function getQuestion(req: AuthRequest, res: Response) {
  try {
    const q = await Question.findByPk(parseInt(req.params.id), {
      include: [
        { model: User, as: 'author', attributes: ['id', 'nickname', 'avatar_url'] },
        { model: Answer, as: 'answers', include: [{ model: User, as: 'author', attributes: ['id', 'nickname', 'avatar_url'] }], where: { status: 'active' }, required: false },
      ],
    });
    if (!q) return fail(res, '问题不存在', 404);
    await q.increment('view_count');
    return success(res, q);
  } catch (error: any) { return fail(res, error.message, 500); }
}

export async function createQuestion(req: AuthRequest, res: Response) {
  try {
    const { title, content, category, tags } = req.body;
    if (!title || !content || !category) return fail(res, '标题、内容和分类不能为空');
    const q = await Question.create({ title, content, category, tags: tags ? JSON.stringify(tags) : null, author_id: req.userId! });
    return success(res, q, '提问成功', 201);
  } catch (error: any) { return fail(res, error.message, 500); }
}

export async function updateQuestion(req: AuthRequest, res: Response) {
  try {
    const q = await Question.findByPk(parseInt(req.params.id));
    if (!q) return fail(res, '问题不存在', 404);
    if (q.author_id !== req.userId) return fail(res, '无权修改', 403);
    const { title, content, category, tags } = req.body;
    if (title) q.title = title;
    if (content) q.content = content;
    if (category) q.category = category;
    if (tags) q.tags = JSON.stringify(tags);
    await q.save();
    return success(res, q, '更新成功');
  } catch (error: any) { return fail(res, error.message, 500); }
}

export async function deleteQuestion(req: AuthRequest, res: Response) {
  try {
    const q = await Question.findByPk(parseInt(req.params.id));
    if (!q) return fail(res, '问题不存在', 404);
    if (q.author_id !== req.userId && req.userRole !== 'admin') return fail(res, '无权删除', 403);
    await q.destroy();
    return success(res, null, '删除成功');
  } catch (error: any) { return fail(res, error.message, 500); }
}

export async function createAnswer(req: AuthRequest, res: Response) {
  try {
    const qId = parseInt(req.params.id);
    const q = await Question.findByPk(qId);
    if (!q) return fail(res, '问题不存在', 404);
    const { content } = req.body;
    if (!content) return fail(res, '回答内容不能为空');
    const a = await Answer.create({ content, question_id: qId, author_id: req.userId! });
    await q.increment('answer_count');
    if (q.author_id !== req.userId) {
      await Notification.create({ user_id: q.author_id, sender_id: req.userId, type: 'comment', title: '有人回答了你的问题', target_type: 'question', target_id: qId });
    }
    const created = await Answer.findByPk(a.id, { include: [{ model: User, as: 'author', attributes: ['id', 'nickname', 'avatar_url'] }] });
    return success(res, created, '回答成功', 201);
  } catch (error: any) { return fail(res, error.message, 500); }
}

export async function deleteAnswer(req: AuthRequest, res: Response) {
  try {
    const a = await Answer.findByPk(parseInt(req.params.id));
    if (!a) return fail(res, '回答不存在', 404);
    if (a.author_id !== req.userId && req.userRole !== 'admin') return fail(res, '无权删除', 403);
    a.status = 'deleted';
    await a.save();
    return success(res, null, '删除成功');
  } catch (error: any) { return fail(res, error.message, 500); }
}

export async function acceptAnswer(req: AuthRequest, res: Response) {
  try {
    const qId = parseInt(req.params.qid);
    const aId = parseInt(req.params.aid);
    const q = await Question.findByPk(qId);
    if (!q) return fail(res, '问题不存在', 404);
    if (q.author_id !== req.userId) return fail(res, '只有提问者可以采纳', 403);
    const a = await Answer.findByPk(aId);
    if (!a || a.question_id !== qId) return fail(res, '回答不存在', 404);

    // Unaccept previous
    if (q.accepted_answer_id) {
      await Answer.update({ is_accepted: false }, { where: { id: q.accepted_answer_id } });
    }
    a.is_accepted = true;
    await a.save();
    q.accepted_answer_id = aId;
    q.status = 'resolved';
    await q.save();

    await Notification.create({ user_id: a.author_id, sender_id: req.userId, type: 'adopt', title: '你的回答被采纳了', target_type: 'question', target_id: qId });
    return success(res, null, '采纳成功');
  } catch (error: any) { return fail(res, error.message, 500); }
}
