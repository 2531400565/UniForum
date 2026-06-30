import { Response } from 'express';
import { User, Post, Resource, Following, Notification } from '../models';
import { success, fail } from '../utils/response';
import { AuthRequest } from '../middlewares/auth';
import { hashPassword } from '../utils/password';
import { getPagination, paginatedResult } from '../utils/pagination';
import { maskEmail, maskStudentId } from '../utils/mask';
import { sanitizeText } from '../utils/sanitize';
import { pushNotification } from '../services/socketService';

export async function getUserProfile(req: AuthRequest, res: Response) {
  try {
    const user = await User.findByPk(parseInt(req.params.id), { attributes: { exclude: ['password_hash'] } });
    if (!user) return fail(res, '用户不存在', 404);
    const postCount = await Post.count({ where: { author_id: user.id, status: 'active' } });
    const resourceCount = await Resource.count({ where: { uploader_id: user.id, status: 'active' } });
    const followerCount = await Following.count({ where: { following_id: user.id } });
    const followingCount = await Following.count({ where: { follower_id: user.id } });

    // 检查当前用户是否已关注
    let isFollowed = false;
    if (req.userId && req.userId !== user.id) {
      const f = await Following.findOne({ where: { follower_id: req.userId, following_id: user.id } });
      isFollowed = !!f;
    }

    return success(res, {
      ...user.toJSON(),
      postCount, resourceCount, followerCount, followingCount, isFollowed,
      email: req.userId === user.id || req.userRole === 'admin' ? user.email : maskEmail(user.email),
      student_id: req.userId === user.id || req.userRole === 'admin' ? user.student_id : (user.student_id ? maskStudentId(user.student_id) : null),
    });
  } catch (error: any) {
    return fail(res, error.message, 500);
  }
}

export async function updateUser(req: AuthRequest, res: Response) {
  try {
    const userId = parseInt(req.params.id);
    if (req.userId !== userId && req.userRole !== 'admin') {
      return fail(res, '无权修改他人资料', 403);
    }
    const user = await User.findByPk(userId);
    if (!user) return fail(res, '用户不存在', 404);

    const { nickname, department, grade, bio } = req.body;
    if (nickname) user.nickname = sanitizeText(nickname);
    if (department !== undefined) user.department = department;
    if (grade !== undefined) user.grade = grade;
    if (bio !== undefined) user.bio = sanitizeText(bio);
    await user.save();

    return success(res, { id: user.id, nickname: user.nickname, department: user.department, grade: user.grade, bio: user.bio }, '更新成功');
  } catch (error: any) {
    return fail(res, error.message, 500);
  }
}

export async function updateAvatar(req: AuthRequest, res: Response) {
  try {
    if (!req.file) return fail(res, '请上传图片');
    const userId = parseInt(req.params.id);
    if (req.userId !== userId) return fail(res, '无权修改', 403);

    const user = await User.findByPk(userId);
    if (!user) return fail(res, '用户不存在', 404);

    user.avatar_url = `/uploads/avatars/${req.file.filename}`;
    await user.save();
    return success(res, { avatarUrl: user.avatar_url }, '头像更新成功');
  } catch (error: any) {
    return fail(res, error.message, 500);
  }
}

export async function updatePassword(req: AuthRequest, res: Response) {
  try {
    const userId = parseInt(req.params.id);
    if (req.userId !== userId) return fail(res, '无权修改', 403);

    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) return fail(res, '请填写旧密码和新密码');
    if (newPassword.length < 6) return fail(res, '新密码长度至少6位');

    const user = await User.findByPk(userId);
    if (!user) return fail(res, '用户不存在', 404);

    const bcrypt = require('bcryptjs');
    const valid = await bcrypt.compare(oldPassword, user.password_hash);
    if (!valid) return fail(res, '旧密码错误');

    user.password_hash = await hashPassword(newPassword);
    await user.save();
    return success(res, null, '密码修改成功');
  } catch (error: any) {
    return fail(res, error.message, 500);
  }
}

export async function getUsers(req: AuthRequest, res: Response) {
  try {
    const { limit, offset, page, pageSize } = getPagination(req.query.page, req.query.pageSize);
    const { keyword } = req.query;
    const where: any = {};
    if (keyword) {
      const { Op } = require('sequelize');
      where[Op.or] = [
        { nickname: { [Op.like]: `%${keyword}%` } },
        { email: { [Op.like]: `%${keyword}%` } },
      ];
    }
    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password_hash'] },
      limit, offset, order: [['created_at', 'DESC']],
    });
    return success(res, paginatedResult(rows, count, page, pageSize));
  } catch (error: any) {
    return fail(res, error.message, 500);
  }
}

export async function updateUserRole(req: AuthRequest, res: Response) {
  try {
    const user = await User.findByPk(parseInt(req.params.id));
    if (!user) return fail(res, '用户不存在', 404);
    const { role } = req.body;
    if (!['user', 'moderator', 'admin'].includes(role)) return fail(res, '无效角色');
    user.role = role;
    await user.save();
    return success(res, null, '角色更新成功');
  } catch (error: any) {
    return fail(res, error.message, 500);
  }
}

export async function updateUserStatus(req: AuthRequest, res: Response) {
  try {
    const user = await User.findByPk(parseInt(req.params.id));
    if (!user) return fail(res, '用户不存在', 404);
    const { status } = req.body;
    if (!['active', 'banned'].includes(status)) return fail(res, '无效状态');
    user.status = status;
    await user.save();
    return success(res, null, '状态更新成功');
  } catch (error: any) {
    return fail(res, error.message, 500);
  }
}

// ============ 关注/取关 ============
export async function followUser(req: AuthRequest, res: Response) {
  try {
    const targetId = parseInt(req.params.id);
    if (targetId === req.userId) return fail(res, '不能关注自己');
    const target = await User.findByPk(targetId);
    if (!target) return fail(res, '用户不存在', 404);

    const [following, created] = await Following.findOrCreate({
      where: { follower_id: req.userId!, following_id: targetId },
    });
    if (!created) return fail(res, '已经关注了');

    // 发送通知
    const notif = await Notification.create({
      user_id: targetId, sender_id: req.userId,
      type: 'system', title: '有人关注了你',
      target_type: 'user', target_id: req.userId!,
    });
    pushNotification(targetId, notif);

    return success(res, null, '关注成功');
  } catch (error: any) {
    return fail(res, error.message, 500);
  }
}

export async function unfollowUser(req: AuthRequest, res: Response) {
  try {
    const targetId = parseInt(req.params.id);
    const following = await Following.findOne({ where: { follower_id: req.userId!, following_id: targetId } });
    if (!following) return fail(res, '未关注该用户');
    await following.destroy();
    return success(res, null, '已取消关注');
  } catch (error: any) {
    return fail(res, error.message, 500);
  }
}

export async function getFollowers(req: AuthRequest, res: Response) {
  try {
    const userId = parseInt(req.params.id);
    const { limit, offset, page, pageSize } = getPagination(req.query.page, req.query.pageSize);
    const where = { following_id: userId };
    const count = await Following.count({ where });
    const rows = await Following.findAll({
      where,
      include: [{ model: User, as: 'followerUser', attributes: ['id', 'nickname', 'avatar_url', 'department'] }],
      limit, offset, order: [['created_at', 'DESC']],
    });
    const list = rows.map((r: any) => r.followerUser);
    return success(res, paginatedResult(list, count, page, pageSize));
  } catch (error: any) {
    return fail(res, error.message, 500);
  }
}

export async function getFollowings(req: AuthRequest, res: Response) {
  try {
    const userId = parseInt(req.params.id);
    const { limit, offset, page, pageSize } = getPagination(req.query.page, req.query.pageSize);
    const where = { follower_id: userId };
    const count = await Following.count({ where });
    const rows = await Following.findAll({
      where,
      include: [{ model: User, as: 'followingUser', attributes: ['id', 'nickname', 'avatar_url', 'department'] }],
      limit, offset, order: [['created_at', 'DESC']],
    });
    const list = rows.map((r: any) => r.followingUser);
    return success(res, paginatedResult(list, count, page, pageSize));
  } catch (error: any) {
    return fail(res, error.message, 500);
  }
}
