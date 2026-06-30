import { Router } from 'express';
import { Op } from 'sequelize';
import { Post, Question, Resource, Announcement, LostAndFound, MarketItem, User } from '../models';
import * as authCtrl from '../controllers/auth.controller';
import * as userCtrl from '../controllers/user.controller';
import * as boardCtrl from '../controllers/board.controller';
import * as postCtrl from '../controllers/post.controller';
import * as commentCtrl from '../controllers/comment.controller';
import * as announcementCtrl from '../controllers/announcement.controller';
import * as lostFoundCtrl from '../controllers/lostFound.controller';
import * as marketCtrl from '../controllers/marketplace.controller';
import * as resourceCtrl from '../controllers/resource.controller';
import * as qaCtrl from '../controllers/qa.controller';
import * as notificationCtrl from '../controllers/notification.controller';
import * as tagCtrl from '../controllers/tag.controller';
import * as messageCtrl from '../controllers/message.controller';
import { auth, optionalAuth } from '../middlewares/auth';
import { requireRole } from '../middlewares/rbac';
import { uploadAvatar, uploadImage, uploadResource } from '../middlewares/upload';
import { authLimiter, uploadLimiter, writeLimiter } from '../middlewares/rateLimiter';

const router = Router();

// Auth
router.post('/auth/register', authLimiter, authCtrl.register);
router.post('/auth/login', authLimiter, authCtrl.login);
router.post('/auth/refresh', authCtrl.refreshToken);
router.get('/auth/me', auth, authCtrl.getMe);

// Users
router.get('/users', auth, requireRole('admin'), userCtrl.getUsers);
router.get('/users/:id', optionalAuth, userCtrl.getUserProfile);
router.put('/users/:id', auth, userCtrl.updateUser);
router.put('/users/:id/avatar', auth, uploadAvatar.single('avatar'), userCtrl.updateAvatar);
router.put('/users/:id/password', auth, userCtrl.updatePassword);
router.put('/users/:id/role', auth, requireRole('admin'), userCtrl.updateUserRole);
router.put('/users/:id/status', auth, requireRole('admin', 'moderator'), userCtrl.updateUserStatus);

// Follow
router.post('/users/:id/follow', auth, writeLimiter, userCtrl.followUser);
router.delete('/users/:id/follow', auth, userCtrl.unfollowUser);
router.get('/users/:id/followers', userCtrl.getFollowers);
router.get('/users/:id/followings', userCtrl.getFollowings);

// Boards
router.get('/boards', boardCtrl.getBoards);
router.get('/boards/:id', boardCtrl.getBoard);
router.post('/boards', auth, requireRole('admin'), boardCtrl.createBoard);
router.put('/boards/:id', auth, requireRole('admin'), boardCtrl.updateBoard);
router.delete('/boards/:id', auth, requireRole('admin'), boardCtrl.deleteBoard);

// Posts
router.get('/posts', optionalAuth, postCtrl.getPosts);
router.get('/posts/:id', optionalAuth, postCtrl.getPost);
router.post('/posts', auth, writeLimiter, postCtrl.createPost);
router.put('/posts/:id', auth, postCtrl.updatePost);
router.delete('/posts/:id', auth, postCtrl.deletePost);
router.post('/posts/:id/like', auth, postCtrl.likePost);
router.delete('/posts/:id/like', auth, postCtrl.unlikePost);
router.get('/posts/:id/like-status', auth, postCtrl.getLikeStatus);
router.post('/posts/:id/favorite', auth, postCtrl.favoritePost);
router.delete('/posts/:id/favorite', auth, postCtrl.unfavoritePost);
router.get('/favorites', auth, postCtrl.getUserFavorites);
router.put('/posts/:id/pin', auth, requireRole('admin', 'moderator'), postCtrl.togglePin);
router.put('/posts/:id/essential', auth, requireRole('admin', 'moderator'), postCtrl.toggleEssential);

// Comments
router.get('/posts/:postId/comments', commentCtrl.getComments);
router.post('/posts/:postId/comments', auth, writeLimiter, commentCtrl.createComment);
router.delete('/comments/:id', auth, commentCtrl.deleteComment);
router.post('/comments/:id/like', auth, commentCtrl.likeComment);
router.delete('/comments/:id/like', auth, commentCtrl.unlikeComment);

// Announcements
router.get('/announcements', optionalAuth, announcementCtrl.getAnnouncements);
router.get('/announcements/:id', optionalAuth, announcementCtrl.getAnnouncement);
router.post('/announcements', auth, requireRole('admin', 'moderator'), announcementCtrl.createAnnouncement);
router.put('/announcements/:id', auth, requireRole('admin', 'moderator'), announcementCtrl.updateAnnouncement);
router.delete('/announcements/:id', auth, requireRole('admin'), announcementCtrl.deleteAnnouncement);

// Lost & Found
router.get('/lost-found', optionalAuth, lostFoundCtrl.getList);
router.get('/lost-found/:id', optionalAuth, lostFoundCtrl.getDetail);
router.post('/lost-found', auth, writeLimiter, lostFoundCtrl.create);
router.put('/lost-found/:id', auth, lostFoundCtrl.update);
router.put('/lost-found/:id/status', auth, lostFoundCtrl.updateStatus);
router.delete('/lost-found/:id', auth, lostFoundCtrl.remove);

// Marketplace
router.get('/marketplace', optionalAuth, marketCtrl.getList);
router.get('/marketplace/:id', optionalAuth, marketCtrl.getDetail);
router.post('/marketplace', auth, writeLimiter, marketCtrl.create);
router.put('/marketplace/:id', auth, marketCtrl.update);
router.put('/marketplace/:id/status', auth, marketCtrl.updateStatus);
router.delete('/marketplace/:id', auth, marketCtrl.remove);

// Resources
router.get('/resources', optionalAuth, resourceCtrl.getResources);
router.get('/resources/:id', optionalAuth, resourceCtrl.getResource);
router.post('/resources', auth, uploadLimiter, uploadResource.single('file'), resourceCtrl.uploadResource);
router.get('/resources/:id/download', auth, resourceCtrl.downloadResource);
router.post('/resources/:id/rating', auth, writeLimiter, resourceCtrl.rateResource);
router.get('/resources/:id/ratings', resourceCtrl.getRatings);
router.put('/resources/:id/status', auth, requireRole('admin', 'moderator'), resourceCtrl.updateResourceStatus);
router.delete('/resources/:id', auth, resourceCtrl.deleteResource);

// QA
router.get('/qa/questions', optionalAuth, qaCtrl.getQuestions);
router.get('/qa/questions/:id', optionalAuth, qaCtrl.getQuestion);
router.post('/qa/questions', auth, writeLimiter, qaCtrl.createQuestion);
router.put('/qa/questions/:id', auth, qaCtrl.updateQuestion);
router.delete('/qa/questions/:id', auth, qaCtrl.deleteQuestion);
router.post('/qa/questions/:id/answers', auth, writeLimiter, qaCtrl.createAnswer);
router.delete('/qa/answers/:id', auth, qaCtrl.deleteAnswer);
router.put('/qa/questions/:qid/answers/:aid/accept', auth, qaCtrl.acceptAnswer);

// Notifications
router.get('/notifications', auth, notificationCtrl.getNotifications);
router.put('/notifications/read-all', auth, notificationCtrl.markAllRead);
router.get('/notifications/unread-count', auth, notificationCtrl.getUnreadCount);
router.put('/notifications/:id/read', auth, notificationCtrl.markRead);

// Search
router.get('/search', async (req, res) => {
  try {
    const { keyword, type } = req.query;
    if (!keyword) return res.json({ code: 200, message: 'success', data: { posts: [], questions: [], resources: [], announcements: [], lostFound: [], marketItems: [] } });
    const kw = `%${keyword}%`;

    const tasks: Promise<void>[] = [];
    const results: any = { posts: [], questions: [], resources: [], announcements: [], lostFound: [], marketItems: [] };

    if (!type || type === 'post') {
      tasks.push(Post.findAll({ where: { [Op.or]: [{ title: { [Op.like]: kw } }, { content: { [Op.like]: kw } }], status: 'active' }, include: [{ model: User, as: 'author', attributes: ['id', 'nickname'] }], limit: 10, order: [['created_at', 'DESC']] }).then((r: any) => { results.posts = r; }));
    }
    if (!type || type === 'question') {
      tasks.push(Question.findAll({ where: { [Op.or]: [{ title: { [Op.like]: kw } }, { content: { [Op.like]: kw } }] }, include: [{ model: User, as: 'author', attributes: ['id', 'nickname'] }], limit: 10, order: [['created_at', 'DESC']] }).then((r: any) => { results.questions = r; }));
    }
    if (!type || type === 'resource') {
      tasks.push(Resource.findAll({ where: { [Op.or]: [{ title: { [Op.like]: kw } }, { description: { [Op.like]: kw } }], status: 'active' }, include: [{ model: User, as: 'uploader', attributes: ['id', 'nickname'] }], limit: 10, order: [['created_at', 'DESC']] }).then((r: any) => { results.resources = r; }));
    }
    if (!type || type === 'announcement') {
      tasks.push(Announcement.findAll({ where: { [Op.or]: [{ title: { [Op.like]: kw } }, { content: { [Op.like]: kw } }], status: 'active' }, include: [{ model: User, as: 'publisher', attributes: ['id', 'nickname'] }], limit: 10, order: [['created_at', 'DESC']] }).then((r: any) => { results.announcements = r; }));
    }
    if (!type || type === 'lostFound') {
      tasks.push(LostAndFound.findAll({ where: { [Op.or]: [{ title: { [Op.like]: kw } }, { description: { [Op.like]: kw } }] }, include: [{ model: User, as: 'author', attributes: ['id', 'nickname'] }], limit: 10, order: [['created_at', 'DESC']] }).then((r: any) => { results.lostFound = r; }));
    }
    if (!type || type === 'marketplace') {
      tasks.push(MarketItem.findAll({ where: { [Op.or]: [{ title: { [Op.like]: kw } }, { description: { [Op.like]: kw } }], status: { [Op.in]: ['selling', 'reserved'] } }, include: [{ model: User, as: 'seller', attributes: ['id', 'nickname'] }], limit: 10, order: [['created_at', 'DESC']] }).then((r: any) => { results.marketItems = r; }));
    }

    await Promise.all(tasks);
    return res.json({ code: 200, message: 'success', data: results });
  } catch (error: any) {
    return res.status(500).json({ code: 500, message: error.message });
  }
});

// Upload image
router.post('/upload/image', auth, uploadLimiter, uploadImage.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ code: 400, message: '请上传图片' });
  res.json({ code: 200, message: '上传成功', data: { url: `/uploads/images/${req.file.filename}` } });
});

// Tags
router.get('/tags', tagCtrl.getTags);
router.get('/tags/search', tagCtrl.searchTags);
router.post('/tags', auth, writeLimiter, tagCtrl.createTag);
router.get('/posts/:postId/tags', tagCtrl.getPostTags);
router.get('/tags/:tagId/posts', tagCtrl.getPostsByTag);

// Messages
router.get('/conversations', auth, messageCtrl.getConversations);
router.get('/conversations/:conversationId', auth, messageCtrl.getConversation);
router.get('/conversations/:conversationId/messages', auth, messageCtrl.getMessages);
router.post('/messages', auth, writeLimiter, messageCtrl.sendMessage);
router.post('/conversations/start', auth, writeLimiter, messageCtrl.startConversation);

export default router;
