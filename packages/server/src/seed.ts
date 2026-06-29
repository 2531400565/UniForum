import { sequelize, User, Board } from './models';
import { hashPassword } from './utils/password';
import { connectDB } from './config/database';

async function seed() {
  await connectDB();
  await sequelize.sync({ force: true });
  console.log('数据库表已重建');

  // Create admin user
  const adminPwd = await hashPassword('admin123');
  await User.create({
    email: 'admin@uniforum.com', password_hash: adminPwd, nickname: '管理员',
    student_id: 'ADMIN001', department: '信息中心', grade: '2024', role: 'admin',
  });

  // Create moderator
  const modPwd = await hashPassword('mod12345');
  await User.create({
    email: 'mod@uniforum.com', password_hash: modPwd, nickname: '版主小王',
    student_id: 'MOD001', department: '计算机学院', grade: '2023', role: 'moderator',
  });

  // Create regular users
  const userPwd = await hashPassword('user12345');
  await User.create({ email: 'zhang@uniforum.com', password_hash: userPwd, nickname: '张三', student_id: '2024001', department: '计算机学院', grade: '2024' });
  await User.create({ email: 'li@uniforum.com', password_hash: userPwd, nickname: '李四', student_id: '2024002', department: '数学学院', grade: '2023' });
  await User.create({ email: 'wang@uniforum.com', password_hash: userPwd, nickname: '王五', student_id: '2024003', department: '外语学院', grade: '2022' });

  // Create boards
  const admin = await User.findOne({ where: { role: 'admin' } });
  const boards = [
    { name: '计算机学院', description: '计算机科学与技术、软件工程等方向交流', category: 'department' as const, icon: 'laptop', sort_order: 100, created_by: admin!.id },
    { name: '数学学院', description: '数学与应用数学、统计学等方向交流', category: 'department' as const, icon: 'calculator', sort_order: 99, created_by: admin!.id },
    { name: '外语学院', description: '英语、日语、翻译等方向交流', category: 'department' as const, icon: 'global', sort_order: 98, created_by: admin!.id },
    { name: '考研交流', description: '考研经验分享、资料互助', category: 'academic' as const, icon: 'book', sort_order: 90, created_by: admin!.id },
    { name: '编程爱好者', description: '编程技术交流、项目组队', category: 'interest' as const, icon: 'code', sort_order: 80, created_by: admin!.id },
    { name: '校园生活', description: '吃喝玩乐、校园趣事分享', category: 'interest' as const, icon: 'smile', sort_order: 70, created_by: admin!.id },
  ];
  await Board.bulkCreate(boards);

  console.log('种子数据创建完成！');
  console.log('管理员账号: admin@uniforum.com / admin123');
  console.log('版主账号: mod@uniforum.com / mod12345');
  console.log('普通用户: zhang@uniforum.com / user12345');

  process.exit(0);
}

seed().catch((err) => { console.error(err); process.exit(1); });
