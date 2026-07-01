import rateLimit from 'express-rate-limit';

// 全局限流: 500次/15分钟/IP
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { code: 429, message: '请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 认证接口限流: 50次/15分钟/IP (登录/注册)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { code: 429, message: '登录尝试过于频繁，请15分钟后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 上传接口限流: 50次/15分钟/IP
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { code: 429, message: '上传过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 写操作限流: 100次/15分钟/IP (发帖/评论)
export const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { code: 429, message: '操作过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});
