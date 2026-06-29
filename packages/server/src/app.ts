import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { config } from './config';

const app = express();

// Ensure upload directories exist
const uploadsDir = path.resolve(__dirname, '../uploads');
['avatars', 'images', 'resources'].forEach(dir => {
  const p = path.join(uploadsDir, dir);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

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
