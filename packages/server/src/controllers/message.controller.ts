import { Response } from 'express';
import { Op, fn, col, where as seqWhere } from 'sequelize';
import { Conversation, Message, User, Notification } from '../models';
import { success, fail } from '../utils/response';
import { AuthRequest } from '../middlewares/auth';
import { getPagination, paginatedResult } from '../utils/pagination';
import { sanitizeText } from '../utils/sanitize';
import { pushNotification, pushMessage } from '../services/socketService';

// 获取或创建会话
async function getOrCreateConversation(userId1: number, userId2: number) {
  // 使用 JSON_CONTAINS 查找已有会话
  const conversations = await Conversation.findAll({
    where: seqWhere(
      fn('JSON_CONTAINS', col('participant_ids'), String(userId1)),
      1
    ),
  });
  const existing = conversations.find(c => {
    const ids = c.participant_ids as number[];
    return ids.includes(userId1) && ids.includes(userId2) && ids.length === 2;
  });
  if (existing) return existing;

  // 创建新会话
  return await Conversation.create({
    participant_ids: [userId1, userId2],
    last_message_at: new Date(),
  });
}

export async function getConversation(req: AuthRequest, res: Response) {
  try {
    const conversationId = parseInt(req.params.conversationId);
    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation) return fail(res, '会话不存在', 404);

    const ids = conversation.participant_ids as number[];
    if (!ids.includes(req.userId!)) return fail(res, '无权访问', 403);

    const otherUserId = ids.find(id => id !== req.userId!);
    const otherUser = await User.findByPk(otherUserId, { attributes: ['id', 'nickname', 'avatar_url'] });

    return success(res, { id: conversation.id, otherUser, otherUserId });
  } catch (error: any) {
    return fail(res, error.message, 500);
  }
}

export async function getConversations(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const conversations = await Conversation.findAll({
      where: seqWhere(
        fn('JSON_CONTAINS', col('participant_ids'), String(userId)),
        1
      ),
      order: [['last_message_at', 'DESC']],
    });

    // 过滤出当前用户参与的会话
    const validConversations = conversations.filter(c => {
      const ids = c.participant_ids as number[];
      return ids.includes(userId);
    });

    if (validConversations.length === 0) return success(res, []);

    // 批量收集 otherUserId 和 conversationId
    const otherUserIds = new Set<number>();
    const convIds: number[] = [];
    for (const conv of validConversations) {
      const ids = conv.participant_ids as number[];
      const otherId = ids.find(id => id !== userId);
      if (otherId) otherUserIds.add(otherId);
      convIds.push(conv.id);
    }

    // 批量查询对方用户信息
    const users = await User.findAll({
      where: { id: { [Op.in]: Array.from(otherUserIds) } },
      attributes: ['id', 'nickname', 'avatar_url'],
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    // 批量查询每个会话的最后一条消息（用子查询取 MAX(id)，避免加载全部消息）
    const lastMsgIds = await Message.findAll({
      attributes: [[fn('MAX', col('id')), 'maxId']],
      where: { conversation_id: { [Op.in]: convIds } },
      group: ['conversation_id'],
      raw: true,
    } as any);
    const maxIds = (lastMsgIds as any[]).map(r => r.maxId).filter(Boolean);
    const lastMessages = maxIds.length > 0 ? await Message.findAll({
      where: { id: { [Op.in]: maxIds } },
      include: [{ model: User, as: 'sender', attributes: ['id', 'nickname'] }],
    }) : [];
    const lastMsgMap = new Map<number, any>();
    for (const msg of lastMessages) {
      lastMsgMap.set(msg.conversation_id, msg);
    }

    // 批量查询未读数
    const unreadRows = await Message.findAll({
      where: { conversation_id: { [Op.in]: convIds }, sender_id: { [Op.ne]: userId }, is_read: false },
      attributes: ['conversation_id', [fn('COUNT', '*'), 'unread']],
      group: ['conversation_id'],
      raw: true,
    } as any);
    const unreadMap = new Map<number, number>();
    for (const row of unreadRows as any[]) {
      unreadMap.set(row.conversation_id, parseInt(row.unread));
    }

    // 组装结果
    const result = validConversations.map(conv => {
      const ids = conv.participant_ids as number[];
      const otherId = ids.find(id => id !== userId)!;
      const otherUser = userMap.get(otherId);
      return {
        id: conv.id,
        otherUser,
        lastMessage: lastMsgMap.get(conv.id) || null,
        unreadCount: unreadMap.get(conv.id) || 0,
        last_message_at: conv.last_message_at,
      };
    });

    return success(res, result);
  } catch (error: any) {
    return fail(res, error.message, 500);
  }
}

export async function getMessages(req: AuthRequest, res: Response) {
  try {
    const conversationId = parseInt(req.params.conversationId);

    // 权限校验：确认当前用户是会话参与者
    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation) return fail(res, '会话不存在', 404);
    const ids = conversation.participant_ids as number[];
    if (!ids.includes(req.userId!)) return fail(res, '无权访问', 403);

    const { limit, offset, page, pageSize } = getPagination(req.query.page, req.query.pageSize);

    const messages = await Message.findAndCountAll({
      where: { conversation_id: conversationId },
      include: [{ model: User, as: 'sender', attributes: ['id', 'nickname', 'avatar_url'] }],
      limit,
      offset,
      order: [['created_at', 'ASC']],
    });

    // 标记为已读
    await Message.update({ is_read: true }, {
      where: { conversation_id: conversationId, sender_id: { [Op.ne]: req.userId! }, is_read: false },
    });

    return success(res, paginatedResult(messages.rows, messages.count, page, pageSize));
  } catch (error: any) {
    return fail(res, error.message, 500);
  }
}

export async function sendMessage(req: AuthRequest, res: Response) {
  try {
    const { targetUserId, content } = req.body;
    if (!targetUserId || !content?.trim()) return fail(res, '参数不完整');

    // 验证目标用户存在
    const targetUser = await User.findByPk(targetUserId);
    if (!targetUser) return fail(res, '目标用户不存在', 404);
    if (targetUser.id === req.userId) return fail(res, '不能给自己发私信', 400);

    const safeContent = sanitizeText(content.trim());
    const conversation = await getOrCreateConversation(req.userId!, targetUserId);

    const message = await Message.create({
      conversation_id: conversation.id,
      sender_id: req.userId!,
      content: safeContent,
    });

    // 更新会话最后消息时间
    conversation.last_message_at = new Date();
    await conversation.save();

    // 查询发送者信息
    const sender = await User.findByPk(req.userId!, { attributes: ['id', 'nickname', 'avatar_url'] });

    // 创建通知给接收者
    const notif = await Notification.create({
      user_id: targetUserId,
      sender_id: req.userId,
      type: 'message',
      title: `${sender?.nickname || '有人'} 给你发了一条私信`,
      content: safeContent.substring(0, 100),
      target_type: 'conversation',
      target_id: conversation.id,
    });

    // 实时推送：私信消息 + 通知
    pushMessage(targetUserId, {
      conversationId: conversation.id,
      content: safeContent,
      senderId: req.userId,
      sender: sender ? sender.toJSON() : null,
      created_at: message.created_at?.toISOString() || new Date().toISOString(),
    });
    pushNotification(targetUserId, notif);

    const fullMessage = await Message.findByPk(message.id, {
      include: [{ model: User, as: 'sender', attributes: ['id', 'nickname', 'avatar_url'] }],
    });

    return success(res, { ...fullMessage?.toJSON(), conversation_id: conversation.id }, '发送成功', 201);
  } catch (error: any) {
    return fail(res, error.message, 500);
  }
}

export async function startConversation(req: AuthRequest, res: Response) {
  try {
    const { targetUserId } = req.body;
    if (!targetUserId) return fail(res, '参数不完整');

    const conversation = await getOrCreateConversation(req.userId!, targetUserId);
    return success(res, { conversationId: conversation.id });
  } catch (error: any) {
    return fail(res, error.message, 500);
  }
}
