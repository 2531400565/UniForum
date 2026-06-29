import { useEffect, useState } from 'react';
import { Typography, List, Avatar, Button, Badge, Space, Card, Empty, message } from 'antd';
import { BellOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import request from '../../api/request';

const typeLabels: any = {
  comment: '评论', reply: '回复', like: '点赞', system: '系统', adopt: '采纳',
};

function getLink(n: any): string {
  if (n.type === 'comment' || n.type === 'reply' || n.type === 'like') return `/forum/post/${n.target_id}`;
  if (n.type === 'adopt') return `/qa/${n.target_id}`;
  return '/';
}

export default function NotificationList() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const fetchData = () => {
    setLoading(true);
    request.get('/notifications', { params: { page, pageSize: 20 } }).then((res: any) => {
      setNotifications(res.data?.list || []);
      setTotal(res.data?.total || 0);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [page]);

  const handleMarkAllRead = async () => {
    try {
      await request.put('/notifications/read-all');
      message.success('已全部标记为已读');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {}
  };

  const handleNotifClick = (n: any) => {
    if (!n.is_read) {
      request.put(`/notifications/${n.id}/read`).catch(() => {});
      setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, is_read: true } : item));
    }
    navigate(getLink(n));
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={3}><BellOutlined /> 我的通知</Typography.Title>
        <Button onClick={handleMarkAllRead}>全部标记已读</Button>
      </div>
      <Card>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 50 }}>加载中...</div>
        ) : notifications.length === 0 ? (
          <Empty description="暂无通知" />
        ) : (
          <List
            dataSource={notifications}
            renderItem={(item: any) => (
              <List.Item
                style={{
                  padding: '12px 8px',
                  cursor: 'pointer',
                  background: item.is_read ? 'transparent' : '#f6faff',
                  borderRadius: 6,
                  marginBottom: 4,
                }}
                onClick={() => handleNotifClick(item)}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar src={item.sender?.avatar_url} icon={<UserOutlined />} style={{ background: '#1677ff' }} />
                  }
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>
                        <Typography.Text strong>{item.sender?.nickname}</Typography.Text>
                        {' '}{typeLabels[item.type] || item.type}了你
                      </span>
                      {!item.is_read && <Badge status="processing" text="未读" />}
                    </div>
                  }
                  description={
                    <div>
                      <Typography.Text type="secondary">{item.title || item.content}</Typography.Text>
                      <div style={{ marginTop: 4 }}>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                          {new Date(item.created_at).toLocaleString('zh-CN')}
                        </Typography.Text>
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
            pagination={{ current: page, total, pageSize: 20, onChange: setPage }}
          />
        )}
      </Card>
    </div>
  );
}
