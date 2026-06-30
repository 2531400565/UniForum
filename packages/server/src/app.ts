import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { globalLimiter } from './middlewares/rateLimiter';
import { config } from './config';

const app = express();

// Ensure upload directories exist
const uploadsDir = path.resolve(__dirname, '../uploads');
['avatars', 'images', 'resources'].forEach(dir => {
  const p = path.join(uploadsDir, dir);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// 全局限流
app.use('/api/v1', globalLimiter);

// Static files for uploads
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));
// 上传文件 404 返回 JSON 而非 HTML
app.use('/uploads', (req, res) => {
  res.status(404).json({ code: 404, message: '文件不存在' });
});

// API routes
app.use('/api/v1', routes);

// Serve frontend static files in production
const webDist = path.resolve(__dirname, '../../web/dist');
app.use(express.static(webDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(webDist, 'index.html'), (err) => {
    if (err) next();
  });
});

// Error handler
app.use(errorHandler);

export default app;
