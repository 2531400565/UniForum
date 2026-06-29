import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Layout, Menu, Input, Badge, Dropdown, Avatar, Space, Typography, Popover, List, Button, Empty, Tag } from 'antd';
import {
  HomeOutlined, MessageOutlined, NotificationOutlined, ShopOutlined,
  QuestionCircleOutlined, FileTextOutlined, SearchOutlined, UserOutlined,
  LogoutOutlined, SettingOutlined, BellOutlined, HeartOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../stores/useAuthStore';
import { useEffect, useState, useCallback } from 'react';
import request from '../../api/request';

const { Header, Content, Footer } = Layout;
const { Text } = Typography;

const typeLabels: any = {
  comment: '评论', reply: '回复', like: '点赞', system: '系统', adopt: '采纳',
};

function getNotificationLink(n: any): string {
  if (n.type === 'comment' || n.type === 'reply' || n.type === 'like') return `/forum/post/${n.target_id}`;
  if (n.type === 'adopt') return `/qa/${n.target_id}`;
  return '/notifications';
}

export default function AppLayout() {
  const { user, isLoggedIn, logout } = useAuthStore();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [searchVal, setSearchVal] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotif, setLoadingNotif] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const fetchUnread = useCallback(() => {
    if (isLoggedIn) {
      request.get('/notifications/unread-count').then((res: any) => setUnread(res.data?.count || 0)).catch(() => {});
    }
  }, [isLoggedIn]);

  useEffect(() => { fetchUnread(); }, [fetchUnread]);

  const fetchNotifications = () => {
    setLoadingNotif(true);
    request.get('/notifications', { params: { pageSize: 10 } }).then((res: any) => {
      setNotifications(res.data?.list || []);
    }).finally(() => setLoadingNotif(false));
  };

  const handleBellClick = () => {
    setPopoverOpen(true);
    fetchNotifications();
  };

  const handleMarkAllRead = async () => {
    try {
      await request.put('/notifications/read-all');
      setUnread(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {}
  };

  const handleNotifClick = (n: any) => {
    setPopoverOpen(false);
    if (!n.is_read) {
      request.put(`/notifications/${n.id}/read`).catch(() => {});
      setUnread(prev => Math.max(0, prev - 1));
    }
    navigate(getNotificationLink(n));
  };

  const menuItems = [
    { key: '/', icon: <HomeOutlined />, label: <Link to="/">首页</Link> },
    { key: '/forum', icon: <MessageOutlined />, label: <Link to="/forum">论坛</Link> },
    { key: '/announcements', icon: <NotificationOutlined />, label: <Link to="/announcements">公告</Link> },
    { key: '/lost-found', icon: <HeartOutlined />, label: <Link to="/lost-found">失物招领</Link> },
    { key: '/marketplace', icon: <ShopOutlined />, label: <Link to="/marketplace">二手市场</Link> },
    { key: '/resources', icon: <FileTextOutlined />, label: <Link to="/resources">资料库</Link> },
    { key: '/qa', icon: <QuestionCircleOutlined />, label: <Link to="/qa">问答</Link> },
  ];

  const userMenu = {
    items: [
      { key: 'profile', icon: <UserOutlined />, label: '个人主页', onClick: () => navigate(`/profile/${user?.id}`) },
      { key: 'admin', icon: <SettingOutlined />, label: '管理后台', onClick: () => navigate('/admin'), style: user?.role === 'admin' ? {} : { display: 'none' } },
      { type: 'divider' as const },
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: () => { logout(); navigate('/'); } },
    ],
  };

  const handleSearch = (value: string) => {
    if (value.trim()) navigate(`/search?keyword=${encodeURIComponent(value.trim())}`);
  };

  const notifContent = (
    <div style={{ width: 340, maxHeight: 420, overflow: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
        <Text strong>通知</Text>
        {unread > 0 && <Button type="link" size="small" onClick={handleMarkAllRead}>全部已读</Button>}
      </div>
      {loadingNotif ? (
        <div style={{ textAlign: 'center', padding: 24 }}>加载中...</div>
      ) : notifications.length === 0 ? (
        <Empty description="暂无通知" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: 24 }} />
      ) : (
        <List
          dataSource={notifications}
          renderItem={(item: any) => (
            <List.Item
              style={{
                padding: '10px 4px',
                cursor: 'pointer',
                background: item.is_read ? 'transparent' : '#f6faff',
                borderRadius: 4,
              }}
              onClick={() => handleNotifClick(item)}
            >
              <List.Item.Meta
                avatar={
                  <Avatar size="small" src={item.sender?.avatar_url} icon={<UserOutlined />} style={{ background: '#1677ff' }} />
                }
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 13 }}>
                      <Text strong style={{ fontSize: 13 }}>{item.sender?.nickname}</Text>
                      {' '}{typeLabels[item.type] || item.type}了你
                    </Text>
                    {!item.is_read && <Badge status="processing" />}
                  </div>
                }
                description={
                  <div>
                    <Text type="secondary" ellipsis style={{ fontSize: 12 }}>{item.title || item.content}</Text>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}
      {notifications.length > 0 && (
        <div style={{ textAlign: 'center', paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
          <Button type="link" size="small" onClick={() => { setPopoverOpen(false); navigate('/notifications'); }}>
            查看全部通知
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', background: '#fff', padding: '0 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="logo" style={{ marginRight: 32, cursor: 'pointer' }} onClick={() => navigate('/')}>
          UniForum
        </div>
        <Menu mode="horizontal" items={menuItems} style={{ flex: 1, minWidth: 0, border: 'none' }} />
        <Space size="middle" style={{ marginLeft: 16 }}>
          <Input.Search
            placeholder="搜索..."
            style={{ width: 200 }}
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            onSearch={handleSearch}
            prefix={<SearchOutlined />}
          />
          {isLoggedIn && (
            <Popover
              content={notifContent}
              trigger="click"
              open={popoverOpen}
              onOpenChange={setPopoverOpen}
              placement="bottomRight"
              arrow={false}
            >
              <Badge count={unread} size="small">
                <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} onClick={handleBellClick} />
              </Badge>
            </Popover>
          )}
          {isLoggedIn ? (
            <Dropdown menu={userMenu} trigger={['click']}>
              <Space style={{ cursor: 'pointer' }}>
                <Avatar size="small" src={user?.avatarUrl} icon={<UserOutlined />} />
                <Text>{user?.nickname}</Text>
              </Space>
            </Dropdown>
          ) : (
            <Space>
              <Link to="/login" style={{ color: '#1677ff' }}>登录</Link>
              <Link to="/register" style={{ color: '#1677ff' }}>注册</Link>
            </Space>
          )}
        </Space>
      </Header>
      <Content style={{ background: '#f5f5f5', minHeight: 'calc(100vh - 134px)' }}>
        <Outlet />
      </Content>
      <Footer style={{ textAlign: 'center', background: '#fff', color: '#999' }}>
        UniForum ©2026 大学校园交流社区
      </Footer>
    </Layout>
  );
}
