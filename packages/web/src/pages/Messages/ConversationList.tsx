import { useEffect, useState, useRef } from 'react';
import { Card, List, Avatar, Typography, Badge, Empty, Spin } from 'antd';
import { UserOutlined, MessageOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import request from '../../api/request';
import { io, Socket } from 'socket.io-client';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

export default function ConversationList() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);

  const fetchConversations = () => {
    request.get('/conversations').then((res: any) => setConversations(res.data || [])).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchConversations();

    // Socket.IO 监听新消息，自动刷新会话列表
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

      socket.on('newMessage', () => {
        fetchConversations();
      });
    }

    return () => { socketRef.current?.disconnect(); };
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>;

  return (
    <div className="page-container" style={{ maxWidth: 700 }}>
      <Typography.Title level={3}><MessageOutlined /> 私信</Typography.Title>
      {conversations.length === 0 ? (
        <Empty description="暂无私信">
          <Typography.Text type="secondary">访问其他用户主页，点击“发消息”即可发起私信</Typography.Text>
        </Empty>
      ) : (
        <List
          dataSource={conversations}
          renderItem={(item: any) => (
            <Card
              hoverable
              style={{ marginBottom: 8, cursor: 'pointer' }}
              onClick={() => navigate(`/messages/${item.id}`)}
              styles={{ body: { padding: '12px 16px' } }}
            >
              <List.Item.Meta
                avatar={
                  <Badge count={item.unreadCount || 0} size="small">
                    <Avatar src={item.otherUser?.avatar_url} icon={<UserOutlined />} size={40} />
                  </Badge>
                }
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography.Text strong>{item.otherUser?.nickname}</Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {item.last_message_at ? dayjs(item.last_message_at).fromNow() : ''}
                    </Typography.Text>
                  </div>
                }
                description={
                  <Typography.Text type="secondary" ellipsis style={{ maxWidth: 400 }}>
                    {item.lastMessage?.content || '暂无消息'}
                  </Typography.Text>
                }
              />
            </Card>
          )}
        />
      )}
    </div>
  );
}
