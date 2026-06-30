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
          {messages.map((msg: any) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
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
