import { create } from 'zustand';

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
}

export const useAuthStore = create<AuthState>((set) => ({
  user: (() => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
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
}));
