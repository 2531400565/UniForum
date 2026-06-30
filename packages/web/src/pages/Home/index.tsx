import { useEffect, useState } from 'react';
import { Card, Row, Col, List, Typography, Tag, Space, Statistic, Avatar } from 'antd';
import { useNavigate, Link } from 'react-router-dom';
import {
  NotificationOutlined, MessageOutlined, QuestionCircleOutlined, ShopOutlined,
  HeartOutlined, FileTextOutlined, FireOutlined, TeamOutlined, LikeOutlined,
} from '@ant-design/icons';
import request from '../../api/request';
import dayjs from 'dayjs';
import { useAuthStore } from '../../stores/useAuthStore';
import { HomeSkeleton } from '../../components/Skeleton';

const { Title, Text, Paragraph } = Typography;

export default function Home() {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuthStore();
  const [data, setData] = useState<any>({ announcements: [], posts: [], questions: [], lostFound: [], marketItems: [], resources: [] });
  const [stats, setStats] = useState({ posts: 0, users: 0, resources: 0, questions: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      request.get('/announcements', { params: { pageSize: 3 } }),
      request.get('/posts', { params: { pageSize: 8, sort: 'hot' } }),
      request.get('/qa/questions', { params: { pageSize: 5 } }),
      request.get('/lost-found', { params: { pageSize: 4 } }),
      request.get('/marketplace', { params: { pageSize: 4, status: 'all' } }),
      request.get('/resources', { params: { pageSize: 4 } }),
    ]).then(([a, p, q, l, m, r]: any[]) => {
      setData({
        announcements: a?.data?.list || [],
        posts: p?.data?.list || [],
        questions: q?.data?.list || [],
        lostFound: l?.data?.list || [],
        marketItems: m?.data?.list || [],
        resources: r?.data?.list || [],
      });
      setStats(s => ({ ...s, posts: p?.data?.total || 0, questions: q?.data?.total || 0 }));
    }).catch(() => {
      // 部分请求失败时仍展示已获取的数据
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <HomeSkeleton />;

  return (
    <div className="page-container">
      {/* 欢迎横幅 */}
      <Card
        style={{
          marginBottom: 16,
          background: 'linear-gradient(135deg, #1677ff 0%, #4096ff 100%)',
          border: 'none',
        }}
        styles={{ body: { padding: '24px 32px' } }}
      >
        <Row align="middle" justify="space-between">
          <Col>
            <Title level={2} style={{ color: '#fff', margin: 0 }}>
              {isLoggedIn ? `欢迎回来，${user?.nickname}！` : '欢迎来到 UniForum'}
            </Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.85)', margin: '8px 0 0', fontSize: 15 }}>
              大学校园交流社区 · 信息发布 · 社交互动 · 资源共享
            </Paragraph>
          </Col>
          <Col>
            <Row gutter={32}>
              <Col>
                <Statistic title={<span style={{ color: 'rgba(255,255,255,0.7)' }}>帖子</span>} value={stats.posts} valueStyle={{ color: '#fff' }} prefix={<MessageOutlined />} />
              </Col>
              <Col>
                <Statistic title={<span style={{ color: 'rgba(255,255,255,0.7)' }}>问答</span>} value={stats.questions} valueStyle={{ color: '#fff' }} prefix={<QuestionCircleOutlined />} />
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      {/* 快捷入口 */}
      <Row gutter={12} style={{ marginBottom: 16 }}>
        {[
          { icon: <MessageOutlined />, label: '论坛', path: '/forum', color: '#1677ff' },
          { icon: <NotificationOutlined />, label: '公告', path: '/announcements', color: '#52c41a' },
          { icon: <HeartOutlined />, label: '失物招领', path: '/lost-found', color: '#eb2f96' },
          { icon: <ShopOutlined />, label: '二手市场', path: '/marketplace', color: '#fa8c16' },
          { icon: <FileTextOutlined />, label: '资料库', path: '/resources', color: '#722ed1' },
          { icon: <QuestionCircleOutlined />, label: '问答', path: '/qa', color: '#13c2c2' },
        ].map(item => (
          <Col xs={8} sm={8} md={4} key={item.label}>
            <Card
              hoverable
              size="small"
              style={{ textAlign: 'center', cursor: 'pointer' }}
              onClick={() => navigate(item.path)}
            >
              <div style={{ fontSize: 24, color: item.color, marginBottom: 4 }}>{item.icon}</div>
              <Text style={{ fontSize: 13 }}>{item.label}</Text>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 公告栏 */}
      {data.announcements.length > 0 && (
        <Card title={<><NotificationOutlined style={{ color: '#52c41a' }} /> 最新公告</>} style={{ marginBottom: 16 }} extra={<Link to="/announcements">更多</Link>}>
          <List
            dataSource={data.announcements}
            renderItem={(item: any) => (
              <List.Item style={{ cursor: 'pointer', padding: '8px 0' }} onClick={() => navigate(`/announcements/${item.id}`)}>
                <Space>
                  <Tag color={item.type === 'notice' ? 'red' : item.type === 'lecture' ? 'blue' : 'green'}>
                    {item.type === 'notice' ? '通知' : item.type === 'lecture' ? '讲座' : item.type === 'club' ? '社团' : '其他'}
                  </Tag>
                  <Text strong>{item.title}</Text>
                </Space>
                <Text type="secondary" style={{ marginLeft: 'auto' }}>{dayjs(item.created_at).format('MM-DD HH:mm')}</Text>
              </List.Item>
            )}
          />
        </Card>
      )}

      <Row gutter={16}>
        {/* 热门帖子 */}
        <Col xs={24} md={14}>
          <Card title={<><FireOutlined style={{ color: '#fa541c' }} /> 热门帖子</>} style={{ marginBottom: 16 }} extra={<Link to="/forum">更多</Link>}>
            <List
              dataSource={data.posts}
              renderItem={(item: any, index: number) => (
                <List.Item style={{ cursor: 'pointer', padding: '10px 0' }} onClick={() => navigate(`/forum/post/${item.id}`)}>
                  <Space>
                    <span style={{
                      display: 'inline-block', width: 24, textAlign: 'center',
                      color: index < 3 ? '#fa541c' : '#999', fontWeight: 'bold', fontSize: 16,
                    }}>{index + 1}</span>
                    <div>
                      <Text strong ellipsis style={{ maxWidth: 280, display: 'block' }}>{item.title}</Text>
                      <Space size="small" style={{ marginTop: 2 }}>
                        <Link to={`/profile/${item.author?.id}`}><Text type="secondary" style={{ fontSize: 12 }}>{item.author?.nickname}</Text></Link>
                        <Text type="secondary" style={{ fontSize: 12 }}>{item.board?.name}</Text>
                      </Space>
                    </div>
                  </Space>
                  <Space style={{ marginLeft: 'auto' }}>
                    <Text type="secondary" style={{ fontSize: 12 }}><LikeOutlined /> {item.like_count}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}><MessageOutlined /> {item.comment_count}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{item.view_count} 浏览</Text>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* 最新问答 */}
        <Col xs={24} md={10}>
          <Card title={<><QuestionCircleOutlined style={{ color: '#13c2c2' }} /> 最新问答</>} style={{ marginBottom: 16 }} extra={<Link to="/qa">更多</Link>}>
            <List
              dataSource={data.questions}
              renderItem={(item: any) => (
                <List.Item style={{ cursor: 'pointer', padding: '10px 0' }} onClick={() => navigate(`/qa/${item.id}`)}>
                  <div>
                    <Space>
                      <Tag color={item.status === 'resolved' ? 'green' : 'orange'}>
                        {item.status === 'resolved' ? '已解决' : '待解答'}
                      </Tag>
                      <Text ellipsis style={{ maxWidth: 200 }}>{item.title}</Text>
                    </Space>
                    <div style={{ marginTop: 2 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>{item.author?.nickname} · {item.answer_count} 回答</Text>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* 底部三栏 */}
      <Row gutter={16}>
        <Col xs={24} md={8}>
          <Card title={<><HeartOutlined style={{ color: '#eb2f96' }} /> 失物招领</>} size="small" extra={<Link to="/lost-found">更多</Link>}>
            <List
              dataSource={data.lostFound}
              renderItem={(item: any) => (
                <List.Item style={{ padding: '6px 0' }}>
                  <Space>
                    <Tag color={item.type === 'lost' ? 'red' : 'green'}>{item.type === 'lost' ? '寻物' : '拾到'}</Tag>
                    <Text ellipsis style={{ maxWidth: 120 }}>{item.title}</Text>
                  </Space>
                  <Text type="secondary" style={{ fontSize: 12, marginLeft: 'auto' }}>{dayjs(item.created_at).format('MM-DD')}</Text>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title={<><ShopOutlined style={{ color: '#fa8c16' }} /> 二手市场</>} size="small" extra={<Link to="/marketplace">更多</Link>}>
            <List
              dataSource={data.marketItems}
              renderItem={(item: any) => (
                <List.Item style={{ padding: '6px 0' }}>
                  <Text ellipsis style={{ maxWidth: 120, textDecoration: item.status === 'sold' ? 'line-through' : 'none', color: item.status === 'sold' ? '#999' : 'inherit' }}>{item.title}</Text>
                  <Space style={{ marginLeft: 'auto' }}>
                    <Text type="danger" style={{ fontSize: 13 }}>¥{item.price}</Text>
                    {item.status === 'sold' && <Tag color="red" style={{ fontSize: 10 }}>已售</Tag>}
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title={<><FileTextOutlined style={{ color: '#722ed1' }} /> 学习资源</>} size="small" extra={<Link to="/resources">更多</Link>}>
            <List
              dataSource={data.resources}
              renderItem={(item: any) => (
                <List.Item style={{ padding: '6px 0' }}>
                  <Text ellipsis style={{ maxWidth: 120 }}>{item.title}</Text>
                  <Text type="secondary" style={{ fontSize: 12, marginLeft: 'auto' }}>{item.download_count} 下载</Text>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
