import axios from 'axios';
import { useAuthStore } from '../stores/useAuthStore';

const request = axios.create({ baseURL: '/api/v1', timeout: 10000 });

request.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Token 刷新锁，防止并发刷新
let isRefreshing = false;
let refreshQueue: ((token: string | null) => void)[] = [];

request.interceptors.response.use(
  (res) => res.data,
  async (err) => {
    const originalRequest = err.config;

    // 401 且非刷新请求且未重试过
    if (err.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/refresh')) {
      // 如果正在刷新，排队等待
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push((token) => {
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(request(originalRequest));
            } else {
              reject(err.response?.data || err);
            }
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('no refresh token');

        const res = await axios.post('/api/v1/auth/refresh', { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = res.data.data;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        // 同步更新 Zustand 状态
        const currentState = useAuthStore.getState();
        useAuthStore.setState({ token: accessToken });

        // 通知队列中的请求
        refreshQueue.forEach((cb) => cb(accessToken));
        refreshQueue = [];

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return request(originalRequest);
      } catch {
        // 刷新失败，清除登录状态
        refreshQueue.forEach((cb) => cb(null));
        refreshQueue = [];
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        useAuthStore.setState({ user: null, token: null, isLoggedIn: false });
        window.location.href = '/login';
        return Promise.reject(err.response?.data || err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err.response?.data || err);
  }
);

export default request;
