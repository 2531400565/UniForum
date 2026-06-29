// 用户角色
export enum Role {
  USER = 'user',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
}

// 用户状态
export enum UserStatus {
  ACTIVE = 'active',
  BANNED = 'banned',
  INACTIVE = 'inactive',
}

// 用户类型
export interface User {
  id: number;
  studentId: string | null;
  email: string;
  nickname: string;
  avatarUrl: string | null;
  department: string | null;
  grade: string | null;
  bio: string | null;
  role: Role;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  postCount?: number;
  resourceCount?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  studentId?: string;
  email: string;
  password: string;
  nickname: string;
  department?: string;
  grade?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}
