import app from './app';
import { connectDB, sequelize } from './config/database';
import { config } from './config';

async function start() {
  await connectDB();
  await sequelize.sync();
  console.log('数据库同步完成');

  app.listen(config.port, () => {
    console.log(`服务器运行在 http://localhost:${config.port}`);
  });
}

start().catch(console.error);
