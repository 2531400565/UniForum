import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('Error:', err);
  const status = err.status || 500;
  const message = err.message || '服务器内部错误';
  res.status(status).json({ code: status, message });
}
