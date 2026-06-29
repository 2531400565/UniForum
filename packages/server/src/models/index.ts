import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

// ============ User ============
interface UserAttributes {
  id: number;
  student_id: string | null;
  email: string;
  password_hash: string;
  nickname: string;
  avatar_url: string | null;
  department: string | null;
  grade: string | null;
  bio: string | null;
  role: 'user' | 'moderator' | 'admin';
  status: 'active' | 'banned' | 'inactive';
}

export class User extends Model<UserAttributes, Optional<UserAttributes, 'id' | 'student_id' | 'avatar_url' | 'department' | 'grade' | 'bio' | 'role' | 'status'>> implements UserAttributes {
  declare id: number;
  declare student_id: string | null;
  declare email: string;
  declare password_hash: string;
  declare nickname: string;
  declare avatar_url: string | null;
  declare department: string | null;
  declare grade: string | null;
  declare bio: string | null;
  declare role: 'user' | 'moderator' | 'admin';
  declare status: 'active' | 'banned' | 'inactive';
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

User.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  student_id: { type: DataTypes.STRING(20), unique: true, allowNull: true },
  email: { type: DataTypes.STRING(100), unique: true, allowNull: false },
  password_hash: { type: DataTypes.STRING(255), allowNull: false },
  nickname: { type: DataTypes.STRING(50), allowNull: false },
  avatar_url: { type: DataTypes.STRING(500), allowNull: true },
  department: { type: DataTypes.STRING(100), allowNull: true },
  grade: { type: DataTypes.STRING(20), allowNull: true },
  bio: { type: DataTypes.TEXT, allowNull: true },
  role: { type: DataTypes.ENUM('user', 'moderator', 'admin'), defaultValue: 'user' },
  status: { type: DataTypes.ENUM('active', 'banned', 'inactive'), defaultValue: 'active' },
}, { sequelize, tableName: 'users' });

// ============ Board ============
interface BoardAttributes {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  category: 'department' | 'interest' | 'academic';
  sort_order: number;
  post_count: number;
  created_by: number;
}

export class Board extends Model<BoardAttributes, Optional<BoardAttributes, 'id' | 'description' | 'icon' | 'sort_order' | 'post_count'>> implements BoardAttributes {
  declare id: number;
  declare name: string;
  declare description: string | null;
  declare icon: string | null;
  declare category: 'department' | 'interest' | 'academic';
  declare sort_order: number;
  declare post_count: number;
  declare created_by: number;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

Board.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  icon: { type: DataTypes.STRING(50), allowNull: true },
  category: { type: DataTypes.ENUM('department', 'interest', 'academic'), allowNull: false },
  sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
  post_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  created_by: { type: DataTypes.INTEGER, allowNull: false },
}, { sequelize, tableName: 'boards' });

// ============ Post ============
interface PostAttributes {
  id: number;
  title: string;
  content: string;
  board_id: number;
  author_id: number;
  type: 'normal' | 'pinned' | 'announcement';
  status: 'active' | 'hidden' | 'deleted';
  view_count: number;
  like_count: number;
  comment_count: number;
}

export class Post extends Model<PostAttributes, Optional<PostAttributes, 'id' | 'type' | 'status' | 'view_count' | 'like_count' | 'comment_count'>> implements PostAttributes {
  declare id: number;
  declare title: string;
  declare content: string;
  declare board_id: number;
  declare author_id: number;
  declare type: 'normal' | 'pinned' | 'announcement';
  declare status: 'active' | 'hidden' | 'deleted';
  declare view_count: number;
  declare like_count: number;
  declare comment_count: number;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

Post.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING(200), allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
  board_id: { type: DataTypes.INTEGER, allowNull: false },
  author_id: { type: DataTypes.INTEGER, allowNull: false },
  type: { type: DataTypes.ENUM('normal', 'pinned', 'announcement'), defaultValue: 'normal' },
  status: { type: DataTypes.ENUM('active', 'hidden', 'deleted'), defaultValue: 'active' },
  view_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  like_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  comment_count: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { sequelize, tableName: 'posts', indexes: [{ fields: ['board_id'] }, { fields: ['author_id'] }, { fields: ['created_at'] }] });

// ============ Comment ============
interface CommentAttributes {
  id: number;
  content: string;
  post_id: number;
  author_id: number;
  parent_id: number | null;
  reply_to_id: number | null;
  status: 'active' | 'deleted';
}

export class Comment extends Model<CommentAttributes, Optional<CommentAttributes, 'id' | 'parent_id' | 'reply_to_id' | 'status'>> implements CommentAttributes {
  declare id: number;
  declare content: string;
  declare post_id: number;
  declare author_id: number;
  declare parent_id: number | null;
  declare reply_to_id: number | null;
  declare status: 'active' | 'deleted';
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

Comment.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  content: { type: DataTypes.TEXT, allowNull: false },
  post_id: { type: DataTypes.INTEGER, allowNull: false },
  author_id: { type: DataTypes.INTEGER, allowNull: false },
  parent_id: { type: DataTypes.INTEGER, allowNull: true },
  reply_to_id: { type: DataTypes.INTEGER, allowNull: true },
  status: { type: DataTypes.ENUM('active', 'deleted'), defaultValue: 'active' },
}, { sequelize, tableName: 'comments', indexes: [{ fields: ['post_id'] }, { fields: ['parent_id'] }] });

// ============ Like ============
interface LikeAttributes {
  id: number;
  user_id: number;
  post_id: number;
}

export class Like extends Model<LikeAttributes, Optional<LikeAttributes, 'id'>> implements LikeAttributes {
  declare id: number;
  declare user_id: number;
  declare post_id: number;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

Like.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  post_id: { type: DataTypes.INTEGER, allowNull: false },
}, { sequelize, tableName: 'likes', indexes: [{ unique: true, fields: ['user_id', 'post_id'] }] });

// ============ Announcement ============
interface AnnouncementAttributes {
  id: number;
  title: string;
  content: string;
  type: 'notice' | 'lecture' | 'club' | 'other';
  publisher_id: number;
  priority: number;
  status: 'active' | 'expired' | 'deleted';
  start_date: Date | null;
  end_date: Date | null;
}

export class Announcement extends Model<AnnouncementAttributes, Optional<AnnouncementAttributes, 'id' | 'priority' | 'status' | 'start_date' | 'end_date'>> implements AnnouncementAttributes {
  declare id: number;
  declare title: string;
  declare content: string;
  declare type: 'notice' | 'lecture' | 'club' | 'other';
  declare publisher_id: number;
  declare priority: number;
  declare status: 'active' | 'expired' | 'deleted';
  declare start_date: Date | null;
  declare end_date: Date | null;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

Announcement.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING(200), allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
  type: { type: DataTypes.ENUM('notice', 'lecture', 'club', 'other'), allowNull: false },
  publisher_id: { type: DataTypes.INTEGER, allowNull: false },
  priority: { type: DataTypes.INTEGER, defaultValue: 0 },
  status: { type: DataTypes.ENUM('active', 'expired', 'deleted'), defaultValue: 'active' },
  start_date: { type: DataTypes.DATE, allowNull: true },
  end_date: { type: DataTypes.DATE, allowNull: true },
}, { sequelize, tableName: 'announcements' });

// ============ LostAndFound ============
interface LostFoundAttributes {
  id: number;
  title: string;
  description: string;
  type: 'lost' | 'found';
  item_category: string;
  location: string | null;
  lost_time: Date | null;
  images: string | null;
  contact_info: string | null;
  status: 'open' | 'resolved' | 'closed';
  author_id: number;
}

export class LostAndFound extends Model<LostFoundAttributes, Optional<LostFoundAttributes, 'id' | 'location' | 'lost_time' | 'images' | 'contact_info' | 'status'>> implements LostFoundAttributes {
  declare id: number;
  declare title: string;
  declare description: string;
  declare type: 'lost' | 'found';
  declare item_category: string;
  declare location: string | null;
  declare lost_time: Date | null;
  declare images: string | null;
  declare contact_info: string | null;
  declare status: 'open' | 'resolved' | 'closed';
  declare author_id: number;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

LostAndFound.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  type: { type: DataTypes.ENUM('lost', 'found'), allowNull: false },
  item_category: { type: DataTypes.STRING(50), allowNull: false },
  location: { type: DataTypes.STRING(200), allowNull: true },
  lost_time: { type: DataTypes.DATE, allowNull: true },
  images: { type: DataTypes.JSON, allowNull: true },
  contact_info: { type: DataTypes.STRING(200), allowNull: true },
  status: { type: DataTypes.ENUM('open', 'resolved', 'closed'), defaultValue: 'open' },
  author_id: { type: DataTypes.INTEGER, allowNull: false },
}, { sequelize, tableName: 'lost_and_found' });

// ============ MarketItem ============
interface MarketItemAttributes {
  id: number;
  title: string;
  description: string;
  price: number;
  original_price: number | null;
  condition_level: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  category: string;
  images: string | null;
  contact_info: string | null;
  status: 'selling' | 'reserved' | 'sold' | 'removed';
  seller_id: number;
}

export class MarketItem extends Model<MarketItemAttributes, Optional<MarketItemAttributes, 'id' | 'original_price' | 'images' | 'contact_info' | 'status'>> implements MarketItemAttributes {
  declare id: number;
  declare title: string;
  declare description: string;
  declare price: number;
  declare original_price: number | null;
  declare condition_level: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  declare category: string;
  declare images: string | null;
  declare contact_info: string | null;
  declare status: 'selling' | 'reserved' | 'sold' | 'removed';
  declare seller_id: number;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

MarketItem.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  original_price: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  condition_level: { type: DataTypes.ENUM('new', 'like_new', 'good', 'fair', 'poor'), allowNull: false },
  category: { type: DataTypes.STRING(50), allowNull: false },
  images: { type: DataTypes.JSON, allowNull: true },
  contact_info: { type: DataTypes.STRING(200), allowNull: true },
  status: { type: DataTypes.ENUM('selling', 'reserved', 'sold', 'removed'), defaultValue: 'selling' },
  seller_id: { type: DataTypes.INTEGER, allowNull: false },
}, { sequelize, tableName: 'market_items', indexes: [{ fields: ['category'] }, { fields: ['status'] }] });

// ============ Resource ============
interface ResourceAttributes {
  id: number;
  title: string;
  description: string | null;
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  category: 'slides' | 'notes' | 'booklist' | 'exam' | 'other';
  subject: string | null;
  download_count: number;
  avg_rating: number;
  rating_count: number;
  status: 'active' | 'pending' | 'rejected' | 'deleted';
  uploader_id: number;
}

export class Resource extends Model<ResourceAttributes, Optional<ResourceAttributes, 'id' | 'description' | 'subject' | 'download_count' | 'avg_rating' | 'rating_count' | 'status'>> implements ResourceAttributes {
  declare id: number;
  declare title: string;
  declare description: string | null;
  declare file_url: string;
  declare file_name: string;
  declare file_size: number;
  declare file_type: string;
  declare category: 'slides' | 'notes' | 'booklist' | 'exam' | 'other';
  declare subject: string | null;
  declare download_count: number;
  declare avg_rating: number;
  declare rating_count: number;
  declare status: 'active' | 'pending' | 'rejected' | 'deleted';
  declare uploader_id: number;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

Resource.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  file_url: { type: DataTypes.STRING(500), allowNull: false },
  file_name: { type: DataTypes.STRING(200), allowNull: false },
  file_size: { type: DataTypes.BIGINT, allowNull: false },
  file_type: { type: DataTypes.STRING(50), allowNull: false },
  category: { type: DataTypes.ENUM('slides', 'notes', 'booklist', 'exam', 'other'), allowNull: false },
  subject: { type: DataTypes.STRING(100), allowNull: true },
  download_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  avg_rating: { type: DataTypes.DECIMAL(2, 1), defaultValue: 0 },
  rating_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  status: { type: DataTypes.ENUM('active', 'pending', 'rejected', 'deleted'), defaultValue: 'pending' },
  uploader_id: { type: DataTypes.INTEGER, allowNull: false },
}, { sequelize, tableName: 'resources', indexes: [{ fields: ['category'] }, { fields: ['subject'] }] });

// ============ ResourceDownload ============
interface ResourceDownloadAttributes {
  id: number;
  resource_id: number;
  user_id: number;
  rating: number | null;
  review: string | null;
}

export class ResourceDownload extends Model<ResourceDownloadAttributes, Optional<ResourceDownloadAttributes, 'id' | 'rating' | 'review'>> implements ResourceDownloadAttributes {
  declare id: number;
  declare resource_id: number;
  declare user_id: number;
  declare rating: number | null;
  declare review: string | null;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

ResourceDownload.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  resource_id: { type: DataTypes.INTEGER, allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  rating: { type: DataTypes.TINYINT, allowNull: true },
  review: { type: DataTypes.TEXT, allowNull: true },
}, { sequelize, tableName: 'resource_downloads', indexes: [{ unique: true, fields: ['resource_id', 'user_id'] }] });

// ============ Question ============
interface QuestionAttributes {
  id: number;
  title: string;
  content: string;
  category: 'course' | 'internship' | 'career' | 'academic' | 'other';
  tags: string | null;
  answer_count: number;
  view_count: number;
  accepted_answer_id: number | null;
  status: 'open' | 'resolved' | 'closed';
  author_id: number;
}

export class Question extends Model<QuestionAttributes, Optional<QuestionAttributes, 'id' | 'tags' | 'answer_count' | 'view_count' | 'accepted_answer_id' | 'status'>> implements QuestionAttributes {
  declare id: number;
  declare title: string;
  declare content: string;
  declare category: 'course' | 'internship' | 'career' | 'academic' | 'other';
  declare tags: string | null;
  declare answer_count: number;
  declare view_count: number;
  declare accepted_answer_id: number | null;
  declare status: 'open' | 'resolved' | 'closed';
  declare author_id: number;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

Question.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING(200), allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
  category: { type: DataTypes.ENUM('course', 'internship', 'career', 'academic', 'other'), allowNull: false },
  tags: { type: DataTypes.JSON, allowNull: true },
  answer_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  view_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  accepted_answer_id: { type: DataTypes.INTEGER, allowNull: true },
  status: { type: DataTypes.ENUM('open', 'resolved', 'closed'), defaultValue: 'open' },
  author_id: { type: DataTypes.INTEGER, allowNull: false },
}, { sequelize, tableName: 'questions' });

// ============ Answer ============
interface AnswerAttributes {
  id: number;
  content: string;
  question_id: number;
  author_id: number;
  like_count: number;
  is_accepted: boolean;
  status: 'active' | 'deleted';
}

export class Answer extends Model<AnswerAttributes, Optional<AnswerAttributes, 'id' | 'like_count' | 'is_accepted' | 'status'>> implements AnswerAttributes {
  declare id: number;
  declare content: string;
  declare question_id: number;
  declare author_id: number;
  declare like_count: number;
  declare is_accepted: boolean;
  declare status: 'active' | 'deleted';
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

Answer.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  content: { type: DataTypes.TEXT, allowNull: false },
  question_id: { type: DataTypes.INTEGER, allowNull: false },
  author_id: { type: DataTypes.INTEGER, allowNull: false },
  like_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  is_accepted: { type: DataTypes.BOOLEAN, defaultValue: false },
  status: { type: DataTypes.ENUM('active', 'deleted'), defaultValue: 'active' },
}, { sequelize, tableName: 'answers' });

// ============ Notification ============
interface NotificationAttributes {
  id: number;
  user_id: number;
  sender_id: number | null;
  type: 'comment' | 'reply' | 'like' | 'system' | 'adopt';
  title: string;
  content: string | null;
  target_type: string | null;
  target_id: number | null;
  is_read: boolean;
}

export class Notification extends Model<NotificationAttributes, Optional<NotificationAttributes, 'id' | 'sender_id' | 'content' | 'target_type' | 'target_id' | 'is_read'>> implements NotificationAttributes {
  declare id: number;
  declare user_id: number;
  declare sender_id: number | null;
  declare type: 'comment' | 'reply' | 'like' | 'system' | 'adopt';
  declare title: string;
  declare content: string | null;
  declare target_type: string | null;
  declare target_id: number | null;
  declare is_read: boolean;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

Notification.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  sender_id: { type: DataTypes.INTEGER, allowNull: true },
  type: { type: DataTypes.ENUM('comment', 'reply', 'like', 'system', 'adopt'), allowNull: false },
  title: { type: DataTypes.STRING(200), allowNull: false },
  content: { type: DataTypes.STRING(500), allowNull: true },
  target_type: { type: DataTypes.STRING(50), allowNull: true },
  target_id: { type: DataTypes.INTEGER, allowNull: true },
  is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { sequelize, tableName: 'notifications', indexes: [{ fields: ['user_id', 'is_read'] }] });

// ============ Associations ============
// Board
Board.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Board.hasMany(Post, { foreignKey: 'board_id', as: 'posts' });

// Post
Post.belongsTo(User, { foreignKey: 'author_id', as: 'author' });
Post.belongsTo(Board, { foreignKey: 'board_id', as: 'board' });
Post.hasMany(Comment, { foreignKey: 'post_id', as: 'comments' });
Post.hasMany(Like, { foreignKey: 'post_id', as: 'likes' });

// Comment
Comment.belongsTo(User, { foreignKey: 'author_id', as: 'author' });
Comment.belongsTo(Post, { foreignKey: 'post_id', as: 'post' });
Comment.belongsTo(Comment, { foreignKey: 'parent_id', as: 'parent' });
Comment.hasMany(Comment, { foreignKey: 'parent_id', as: 'replies' });
Comment.belongsTo(User, { foreignKey: 'reply_to_id', as: 'replyTo' });

// Like
Like.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Like.belongsTo(Post, { foreignKey: 'post_id', as: 'post' });

// Announcement
Announcement.belongsTo(User, { foreignKey: 'publisher_id', as: 'publisher' });

// LostAndFound
LostAndFound.belongsTo(User, { foreignKey: 'author_id', as: 'author' });

// MarketItem
MarketItem.belongsTo(User, { foreignKey: 'seller_id', as: 'seller' });

// Resource
Resource.belongsTo(User, { foreignKey: 'uploader_id', as: 'uploader' });
Resource.hasMany(ResourceDownload, { foreignKey: 'resource_id', as: 'downloads' });

// ResourceDownload
ResourceDownload.belongsTo(Resource, { foreignKey: 'resource_id', as: 'resource' });
ResourceDownload.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Question
Question.belongsTo(User, { foreignKey: 'author_id', as: 'author' });
Question.hasMany(Answer, { foreignKey: 'question_id', as: 'answers' });
Question.belongsTo(Answer, { foreignKey: 'accepted_answer_id', as: 'acceptedAnswer' });

// Answer
Answer.belongsTo(Question, { foreignKey: 'question_id', as: 'question' });
Answer.belongsTo(User, { foreignKey: 'author_id', as: 'author' });

// Notification
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'receiver' });
Notification.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });

export { sequelize };
