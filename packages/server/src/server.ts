import app from './app';
import { connectDB, sequelize } from './config/database';
import { config } from './config';

async function start() {
  await connectDB();
  try {
    await sequelize.sync();
    console.log('数据库同步完成');
  } catch (e: any) {
    console.log('数据库同步跳过:', e.message?.substring(0, 100));
  }

  app.listen(config.port, () => {
    console.log(`服务器运行在 http://localhost:${config.port}`);
  });
}

start().catch(console.error);
