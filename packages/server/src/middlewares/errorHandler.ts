import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('Error:', err);

  // multer 错误处理
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ code: 400, message: '文件大小超过限制' });
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ code: 400, message: '不支持的文件字段' });
  }
  if (err.message?.includes('只支持')) {
    return res.status(400).json({ code: 400, message: err.message });
  }

  const status = err.status || 500;
  const msg = err.message || '服务器内部错误';
  res.status(status).json({ code: status, message: msg });
}
