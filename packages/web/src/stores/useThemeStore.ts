import { create } from 'zustand';

type ThemeMode = 'light' | 'dark';

interface ThemeState {
  themeMode: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  themeMode: (localStorage.getItem('themeMode') as ThemeMode) || 'light',
  toggleTheme: () =>
    set((state) => {
      const newMode = state.themeMode === 'light' ? 'dark' : 'light';
      localStorage.setItem('themeMode', newMode);
      return { themeMode: newMode };
    }),
  setTheme: (mode) => {
    localStorage.setItem('themeMode', mode);
    set({ themeMode: mode });
  },
}));
