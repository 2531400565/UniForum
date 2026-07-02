import { useEffect, useState } from 'react';
import { Typography, List, Avatar, Button, Badge, Space, Card, Empty, Pagination, Segmented, message } from 'antd';
import { BellOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import request from '../../api/request';
import { getNotificationLink as getLink, getNotifTypeLabel } from '../../utils/notification';

export default function NotificationList() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<string>('all');
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchData = () => {
    setLoading(true);
    request.get('/notifications', { params: { page, pageSize: 20, filter } }).then((res: any) => {
      setNotifications(res.data?.list || []);
      setTotal(res.data?.total || 0);
    }).finally(() => setLoading(false));
  };

  const fetchUnreadCount = () => {
    request.get('/notifications/unread-count').then((res: any) => setUnreadCount(res.data?.count || 0)).catch(() => {});
  };

  useEffect(() => { fetchData(); }, [page, filter]);
  useEffect(() => { fetchUnreadCount(); }, []);

  const handleMarkAllRead = async () => {
    try {
      await request.put('/notifications/read-all');
      message.success('已全部标记为已读');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      fetchData();
    } catch {}
  };

  const handleNotifClick = (n: any) => {
    if (!n.is_read) {
      request.put(`/notifications/${n.id}/read`).catch(() => {});
      setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, is_read: true } : item));
      setUnreadCount(c => Math.max(0, c - 1));
    }
    navigate(getLink(n));
  };

  const filterOptions = [
    { label: '全部', value: 'all' },
    { label: <span>未读 {unreadCount > 0 && <Badge count={unreadCount} size="small" offset={[4, -2]} />}</span>, value: 'unread' },
    { label: '已读', value: 'read' },
  ];

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={3}><BellOutlined /> 我的通知</Typography.Title>
        <Space>
          <Segmented options={filterOptions} value={filter} onChange={(v) => { setFilter(v as string); setPage(1); }} />
          <Button onClick={handleMarkAllRead} disabled={unreadCount === 0}>全部标记已读</Button>
        </Space>
      </div>
      <Card>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 50 }}>加载中...</div>
        ) : notifications.length === 0 ? (
          <Empty description={filter === 'unread' ? '没有未读通知' : filter === 'read' ? '没有已读通知' : '暂无通知'} />
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
                        {item.type === 'message' ? getNotifTypeLabel(item) : (item.target_type === 'marketplace' || item.target_type === 'lost_found') ? getNotifTypeLabel(item) : `${getNotifTypeLabel(item)}了你`}
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
          />
        )}
      </Card>
      {total > 0 && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Pagination current={page} total={total} pageSize={20} onChange={setPage} showSizeChanger={false} showTotal={(t) => `共 ${t} 条通知`} />
        </div>
      )}
    </div>
  );
}
