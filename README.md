# UniForum - 大学校园交流社区

UniForum 是一个面向高校师生的综合性校园交流社区平台，集成了论坛讨论、公告发布、失物招领、二手交易、学习资料共享、问答互助、实时私信等核心功能模块。

## 功能特性

- **用户系统** - 注册/登录、JWT 认证、个人主页、关注/粉丝
- **论坛系统** - 板块管理、帖子发布、评论回复、点赞收藏、置顶精华
- **实时私信** - Socket.IO 实时聊天、消息时间分组
- **通知系统** - 评论/点赞/关注实时推送、未读计数
- **失物招领** - 寻物/拾到发布、状态流转、联系方式脱敏
- **二手市场** - 商品发布、状态管理、联系方式脱敏
- **资料共享** - 文件上传下载、评分评价、管理员审核
- **问答系统** - 提问/回答、采纳最佳答案
- **管理后台** - 用户管理、内容审核、数据统计

## 技术栈

| 层面 | 技术选型 |
|------|----------|
| 前端 | React 18 + TypeScript + Vite 5 |
| UI 库 | Ant Design 5 |
| 状态管理 | Zustand |
| 实时通信 | Socket.IO |
| 后端 | Node.js + Express + TypeScript |
| 数据库 | MySQL + Sequelize ORM |
| 认证 | JWT (Access Token + Refresh Token) |

## 项目结构

```
UniForum/
├── packages/
│   ├── web/                          # 前端应用
│   │   ├── src/
│   │   │   ├── api/                  # Axios 请求封装
│   │   │   ├── components/           # 公共组件
│   │   │   ├── pages/                # 页面组件
│   │   │   ├── stores/               # Zustand 状态管理
│   │   │   └── utils/                # 工具函数
│   │   └── vite.config.ts
│   ├── server/                       # 后端应用
│   │   ├── src/
│   │   │   ├── controllers/          # 控制器 (14个)
│   │   │   ├── middlewares/          # 中间件
│   │   │   ├── models/               # Sequelize 模型
│   │   │   ├── routes/               # 路由定义
│   │   │   └── services/             # 服务层
│   │   └── tsconfig.json
│   └── shared/                       # 共享类型定义
├── package.json
└── .env
```

## 快速开始

### 环境要求

- Node.js >= 18
- MySQL >= 5.7
- npm >= 9

### 安装依赖

```bash
npm install
```

### 配置环境变量

复制 `.env.example` 为 `.env`，并修改数据库配置：

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=uniforum
DB_USER=root
DB_PASS=your_password
JWT_SECRET=your_jwt_secret
```

### 初始化数据库

```bash
# 创建数据库
mysql -u root -p -e "CREATE DATABASE uniforum CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 手动创建 item_comments 表
mysql -u root -p uniforum < sql/item_comments.sql
```

### 启动开发服务器

```bash
# 启动后端 (端口 3000)
npm run dev:server

# 启动前端 (端口 5173，新终端)
npm run dev:web
```

访问 http://localhost:5173

### 构建生产版本

```bash
npm run build:server
npm run build:web
```

## API 接口

| 模块 | 接口前缀 | 说明 |
|------|----------|------|
| 认证 | `/api/v1/auth` | 注册/登录/Token刷新 |
| 用户 | `/api/v1/users` | 用户资料/关注/粉丝 |
| 论坛 | `/api/v1/posts` | 帖子CRUD/点赞/收藏 |
| 评论 | `/api/v1/comments` | 评论CRUD/点赞 |
| 公告 | `/api/v1/announcements` | 公告管理 |
| 失物招领 | `/api/v1/lost-found` | 失物招领CRUD |
| 二手市场 | `/api/v1/marketplace` | 商品CRUD |
| 资源 | `/api/v1/resources` | 资源上传/下载/评分 |
| 问答 | `/api/v1/qa` | 问答CRUD/采纳 |
| 私信 | `/api/v1/messages` | 私信发送/会话管理 |
| 通知 | `/api/v1/notifications` | 通知列表/已读管理 |
| 搜索 | `/api/v1/search` | 全局搜索 |

## 数据库设计

系统共 17 张数据表：

- users - 用户表
- boards - 板块表
- posts - 帖子表
- comments - 论坛评论表
- item_comments - 通用评论表 (二手市场/失物招领)
- likes - 帖子点赞表
- comment_likes - 评论点赞表
- announcements - 公告表
- lost_and_found - 失物招领表
- market_items - 二手市场表
- resources - 资源表
- resource_downloads - 下载记录表
- questions - 问题表
- answers - 回答表
- notifications - 通知表
- favorites - 收藏表
- followings - 关注关系表
- tags / post_tags - 标签关联表
- conversations / messages - 会话/消息表

## 安全特性

- JWT 双 Token 认证 (Access Token 2h + Refresh Token 7d)
- 四级速率限制 (全局/认证/上传/写操作)
- XSS 防护 (sanitize-html + DOMPurify)
- 联系方式脱敏 (smartMask)
- 文件上传校验 (类型+大小)
- RBAC 权限控制 (user/moderator/admin)

## License

MIT
