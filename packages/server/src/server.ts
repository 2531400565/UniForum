import app from './app';
import { connectDB, sequelize } from './config/database';
import { config } from './config';
import http from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { initSocket } from './services/socketService';

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: config.clientUrl, credentials: true },
  path: '/socket.io',
});

// 注册 io 实例供控制器使用
initSocket(io);

// JWT 认证中间件
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('未认证'));
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as any;
    socket.data.userId = decoded.userId;
    next();
  } catch {
    next(new Error('认证失败'));
  }
});

io.on('connection', (socket) => {
  const userId = socket.data.userId;
  socket.join(`user:${userId}`);

  // 帖子实时评论房间
  socket.on('joinPost', (postId: number) => {
    socket.join(`post:${postId}`);
  });
  socket.on('leavePost', (postId: number) => {
    socket.leave(`post:${postId}`);
  });

  socket.on('disconnect', () => {
    // Socket.IO 自动从所有 room 移除，无需手动 leave
  });
});

async function start() {
  await connectDB();
  try {
    await sequelize.sync({ alter: true });
    console.log('数据库同步完成');
  } catch (e: any) {
    console.log('数据库同步跳过:', e.message?.substring(0, 100));
  }

  server.listen(config.port, () => {
    console.log(`服务器运行在 http://localhost:${config.port}`);
  });
}

start().catch(console.error);
