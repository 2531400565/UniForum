import { create } from 'zustand';
import request from '../api/request';

interface UserInfo {
  id: number;
  email: string;
  nickname: string;
  role: string;
  studentId: string | null;
  department: string | null;
  grade: string | null;
  avatarUrl: string | null;
  bio: string | null;
}

interface AuthState {
  user: UserInfo | null;
  token: string | null;
  isLoggedIn: boolean;
  setAuth: (user: UserInfo, token: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (user: Partial<UserInfo>) => void;
  validateToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: (() => {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  })(),
  token: localStorage.getItem('accessToken'),
  isLoggedIn: !!localStorage.getItem('accessToken'),
  setAuth: (user, token, refreshToken) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('accessToken', token);
    localStorage.setItem('refreshToken', refreshToken);
    set({ user, token, isLoggedIn: true });
  },
  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, token: null, isLoggedIn: false });
  },
  updateUser: (partial) => set((state) => ({ user: state.user ? { ...state.user, ...partial } : null })),
  validateToken: async () => {
    const token = get().token;
    if (!token) return;
    try {
      const res: any = await request.get('/auth/me');
      if (res.data) {
        set({ user: { ...get().user, ...res.data } as UserInfo });
      }
    } catch {
      // Token 无效且刷新失败，执行登出
      get().logout();
    }
  },
}));

// 初始化时验证 Token（静默执行，不阻塞页面渲染）
if (typeof window !== 'undefined' && localStorage.getItem('accessToken')) {
  useAuthStore.getState().validateToken();
}
