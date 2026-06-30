import { useEffect, useState, useRef } from 'react';
import { Card, Avatar, Typography, Input, Button, List, Spin, Space, message } from 'antd';
import { UserOutlined, SendOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import request from '../../api/request';
import { useAuthStore } from '../../stores/useAuthStore';
import { io, Socket } from 'socket.io-client';
import dayjs from 'dayjs';

export default function ChatView() {
  const { id: conversationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState('');
  const [otherUser, setOtherUser] = useState<any>(null);
  const [targetUserId, setTargetUserId] = useState<number | null>((location.state as any)?.targetUserId || null);
  const listEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // 加载消息
    request.get(`/conversations/${conversationId}/messages`, { params: { pageSize: 100 } })
      .then((res: any) => {
        setMessages(res.data?.list || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // 加载会话详情
    request.get(`/conversations/${conversationId}`).then((res: any) => {
      const conv = res.data;
      if (conv) {
        setOtherUser(conv.otherUser);
        if (conv.otherUserId) setTargetUserId(conv.otherUserId);
      }
    }).catch(() => {});

    // 连接 Socket.IO（带自动重连）
    const token = localStorage.getItem('accessToken');
    if (token) {
      const socket = io(window.location.origin, {
        auth: { token },
        path: '/socket.io',
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10,
      });
      socketRef.current = socket;

      socket.on('newMessage', (data: any) => {
        if (data.conversationId === Number(conversationId)) {
          // 跳过自己发送的消息（已通过 REST API 响应添加）
          if (data.senderId === user?.id || data.sender_id === user?.id) return;
          // 统一字段名：socket 用 senderId，API 用 sender_id
          const normalized = { ...data, sender_id: data.senderId || data.sender_id };
          setMessages(prev => [...prev, normalized]);
        }
      });

      // 重连后重新拉取消息，避免漏掉断线期间的消息（跳过首次连接）
      let isFirstConnect = true;
      socket.on('connect', () => {
        if (isFirstConnect) { isFirstConnect = false; return; }
        request.get(`/conversations/${conversationId}/messages`, { params: { pageSize: 100 } })
          .then((res: any) => setMessages(res.data?.list || []))
          .catch(() => {});
      });
    }

    return () => {
      socketRef.current?.disconnect();
    };
  }, [conversationId]);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const res: any = await request.post('/messages', {
        targetUserId: targetUserId,
        content: text,
      });
      const newMsg = res.data;
      setMessages(prev => [...prev, newMsg]);
      setText('');
      // REST API 已处理消息持久化和实时推送，无需再通过 Socket.IO 重复发送
    } catch (err: any) {
      message.error(err.message || '发送失败');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'Enter') handleSend();
  };

  // 判断两条消息是否在同一天
  const isSameDay = (a: string, b: string) => dayjs(a).isSame(dayjs(b), 'day');
  // 判断是否是今天
  const isToday = (date: string) => dayjs(date).isSame(dayjs(), 'day');
  // 判断是否是昨天
  const isYesterday = (date: string) => dayjs(date).isSame(dayjs().subtract(1, 'day'), 'day');
  // 格式化日期显示
  const formatDateLabel = (date: string) => {
    if (isToday(date)) return '今天';
    if (isYesterday(date)) return '昨天';
    return dayjs(date).format('YYYY年M月D日');
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>;

  return (
    <div className="page-container" style={{ maxWidth: 700 }}>
      <Card
        title={
          <Space>
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/messages')} />
            <Avatar src={otherUser?.avatar_url} icon={<UserOutlined />} size="small" />
            <Typography.Text strong>{otherUser?.nickname}</Typography.Text>
          </Space>
        }
        styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 260px)', minHeight: 400 } }}
      >
        {/* 消息列表 */}
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          {messages.map((msg: any, index: number) => {
            const isMe = msg.sender_id === user?.id;
            const prevMsg = index > 0 ? messages[index - 1] : null;
            // 是否需要显示日期分隔线：第一条消息 或 与上一条消息不在同一天
            const showDateDivider = !prevMsg || !isSameDay(prevMsg.created_at, msg.created_at);
            // 是否是今天之前的最后一条历史消息（今天的第一条消息之前）
            const isLastHistoryMsg = showDateDivider && isToday(msg.created_at) && prevMsg && !isToday(prevMsg.created_at);

            return (
              <div key={msg.id}>
                {/* 历史消息分隔线 */}
                {isLastHistoryMsg && (
                  <div style={{ textAlign: 'center', margin: '8px 0 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 1, background: '#e8e8e8' }} />
                      <Typography.Text type="secondary" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>以上为历史消息</Typography.Text>
                      <div style={{ flex: 1, height: 1, background: '#e8e8e8' }} />
                    </div>
                  </div>
                )}
                {/* 日期分隔线 */}
                {showDateDivider && (
                  <div style={{ textAlign: 'center', margin: '16px 0 12px' }}>
                    <Typography.Text type="secondary" style={{ fontSize: 12, background: '#f5f5f5', padding: '4px 12px', borderRadius: 10 }}>
                      {formatDateLabel(msg.created_at)}
                    </Typography.Text>
                  </div>
                )}
                {/* 消息气泡 */}
                <div style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
                  {!isMe && <Avatar src={msg.sender?.avatar_url} icon={<UserOutlined />} style={{ marginRight: 8, flexShrink: 0 }} />}
                  <div style={{
                    maxWidth: '70%', padding: '8px 12px', borderRadius: 12,
                    background: isMe ? '#1677ff' : '#f0f0f0',
                    color: isMe ? '#fff' : 'inherit',
                  }}>
                    <div>{msg.content}</div>
                    <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4, textAlign: 'right' }}>
                      {dayjs(msg.created_at).format('HH:mm')}
                    </div>
                  </div>
                  {isMe && <Avatar src={user?.avatarUrl} icon={<UserOutlined />} style={{ marginLeft: 8, flexShrink: 0 }} />}
                </div>
              </div>
            );
          })}
          <div ref={listEndRef} />
        </div>

        {/* 输入框 */}
        <div style={{ padding: 12, borderTop: '1px solid #f0f0f0', display: 'flex', gap: 8 }}>
          <Input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息... (Ctrl+Enter 发送)"
            onPressEnter={handleSend}
            style={{ flex: 1 }}
          />
          <Button type="primary" icon={<SendOutlined />} loading={sending} onClick={handleSend} disabled={!text.trim()}>
            发送
          </Button>
        </div>
      </Card>
    </div>
  );
}
