import { Response } from 'express';

export function success(res: Response, data: any = null, message: string = 'success', code: number = 200) {
  return res.status(code).json({ code, message, data });
}

export function fail(res: Response, message: string = 'error', code: number = 400, data: any = null) {
  return res.status(code).json({ code, message, data });
}
