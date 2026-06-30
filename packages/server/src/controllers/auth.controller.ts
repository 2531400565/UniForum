import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import { hashPassword, comparePassword } from '../utils/password';
import { success, fail } from '../utils/response';
import { config } from '../config';
import { AuthRequest } from '../middlewares/auth';

function generateTokens(user: { id: number; role: string }) {
  const accessToken = jwt.sign({ userId: user.id, role: user.role }, config.jwt.secret as jwt.Secret, { expiresIn: config.jwt.accessTokenExpiry } as jwt.SignOptions);
  const refreshToken = jwt.sign({ userId: user.id, role: user.role }, config.jwt.refreshSecret as jwt.Secret, { expiresIn: config.jwt.refreshTokenExpiry } as jwt.SignOptions);
  return { accessToken, refreshToken };
}

export async function register(req: Request, res: Response) {
  try {
    const { email, password, nickname, studentId, department, grade } = req.body;
    if (!email || !password || !nickname) {
      return fail(res, '邮箱、密码和昵称为必填项');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return fail(res, '邮箱格式不正确');
    }
    if (password.length < 6) {
      return fail(res, '密码长度至少6位');
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) return fail(res, '该邮箱已被注册');

    if (studentId) {
      const existingStudent = await User.findOne({ where: { student_id: studentId } });
      if (existingStudent) return fail(res, '该学号已被注册');
    }

    const password_hash = await hashPassword(password);
    const user = await User.create({
      email, password_hash, nickname,
      student_id: studentId || null,
      department: department || null,
      grade: grade || null,
    });

    const tokens = generateTokens({ id: user.id, role: user.role });
    const userData = { id: user.id, email: user.email, nickname: user.nickname, role: user.role, studentId: user.student_id, department: user.department, grade: user.grade, avatarUrl: user.avatar_url, bio: user.bio };

    return success(res, { user: userData, ...tokens }, '注册成功');
  } catch (error: any) {
    return fail(res, error.message || '注册失败', 500);
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return fail(res, '邮箱和密码不能为空');

    const user = await User.findOne({ where: { email } });
    if (!user) return fail(res, '邮箱或密码错误');
    if (user.status !== 'active') return fail(res, '账号已被禁用');

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) return fail(res, '邮箱或密码错误');

    const tokens = generateTokens({ id: user.id, role: user.role });
    const userData = { id: user.id, email: user.email, nickname: user.nickname, role: user.role, studentId: user.student_id, department: user.department, grade: user.grade, avatarUrl: user.avatar_url, bio: user.bio };

    return success(res, { user: userData, ...tokens }, '登录成功');
  } catch (error: any) {
    return fail(res, error.message || '登录失败', 500);
  }
}

export async function refreshToken(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return fail(res, '缺少refreshToken');

    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as { userId: number; role: string };
    const user = await User.findByPk(decoded.userId);
    if (!user || user.status !== 'active') return fail(res, '用户不存在或已被禁用');

    const tokens = generateTokens({ id: user.id, role: user.role });
    return success(res, tokens);
  } catch {
    return fail(res, 'RefreshToken无效或已过期', 401);
  }
}

export async function getMe(req: AuthRequest, res: Response) {
  try {
    const user = await User.findByPk(req.userId!, { attributes: { exclude: ['password_hash'] } });
    if (!user) return fail(res, '用户不存在', 404);
    return success(res, user);
  } catch (error: any) {
    return fail(res, error.message, 500);
  }
}
