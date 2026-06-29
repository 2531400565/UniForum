import { useEffect, useState } from 'react';
import { Card, Row, Col, List, Typography, Tag, Space, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import { NotificationOutlined, MessageOutlined, QuestionCircleOutlined, ShopOutlined, HeartOutlined, FileTextOutlined } from '@ant-design/icons';
import request from '../../api/request';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function Home() {
  const navigate = useNavigate();
  const [data, setData] = useState<any>({ announcements: [], posts: [], questions: [], lostFound: [], marketItems: [], resources: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      request.get('/announcements', { params: { pageSize: 5 } }),
      request.get('/posts', { params: { pageSize: 10, sort: 'hot' } }),
      request.get('/qa/questions', { params: { pageSize: 5 } }),
      request.get('/lost-found', { params: { pageSize: 5 } }),
      request.get('/marketplace', { params: { pageSize: 5 } }),
      request.get('/resources', { params: { pageSize: 5 } }),
    ]).then(([a, p, q, l, m, r]: any[]) => {
      setData({
        announcements: a.data?.list || [],
        posts: p.data?.list || [],
        questions: q.data?.list || [],
        lostFound: l.data?.list || [],
        marketItems: m.data?.list || [],
        resources: r.data?.list || [],
      });
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>;

  return (
    <div className="page-container">
      {/* Announcements */}
      <Card title={<><NotificationOutlined /> 最新公告</>} style={{ marginBottom: 16 }} extra={<a onClick={() => navigate('/announcements')}>更多</a>}>
        <List dataSource={data.announcements} renderItem={(item: any) => (
          <List.Item style={{ cursor: 'pointer' }} onClick={() => navigate(`/announcements/${item.id}`)}>
            <Tag color={item.type === 'notice' ? 'red' : item.type === 'lecture' ? 'blue' : 'green'}>
              {item.type === 'notice' ? '通知' : item.type === 'lecture' ? '讲座' : '社团'}
            </Tag>
            <Text strong>{item.title}</Text>
            <Text type="secondary" style={{ marginLeft: 'auto' }}>{dayjs(item.created_at).format('MM-DD')}</Text>
          </List.Item>
        )} />
      </Card>

      <Row gutter={16}>
        {/* Hot Posts */}
        <Col span={12}>
          <Card title={<><MessageOutlined /> 热门帖子</>} extra={<a onClick={() => navigate('/forum')}>更多</a>}>
            <List dataSource={data.posts.slice(0, 8)} renderItem={(item: any) => (
              <List.Item style={{ cursor: 'pointer' }} onClick={() => navigate(`/forum/post/${item.id}`)}>
                <Text ellipsis style={{ maxWidth: 300 }}>{item.title}</Text>
                <Space style={{ marginLeft: 'auto' }}>
                  <Text type="secondary">{item.like_count}赞</Text>
                  <Text type="secondary">{item.comment_count}评</Text>
                </Space>
              </List.Item>
            )} />
          </Card>
        </Col>

        {/* QA */}
        <Col span={12}>
          <Card title={<><QuestionCircleOutlined /> 最新问答</>} extra={<a onClick={() => navigate('/qa')}>更多</a>}>
            <List dataSource={data.questions} renderItem={(item: any) => (
              <List.Item style={{ cursor: 'pointer' }} onClick={() => navigate(`/qa/${item.id}`)}>
                <Tag color={item.status === 'resolved' ? 'green' : 'orange'}>{item.status === 'resolved' ? '已解决' : '待解答'}</Tag>
                <Text ellipsis style={{ maxWidth: 250 }}>{item.title}</Text>
                <Text type="secondary" style={{ marginLeft: 'auto' }}>{item.answer_count}回答</Text>
              </List.Item>
            )} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={8}>
          <Card title={<><HeartOutlined /> 失物招领</>} size="small" extra={<a onClick={() => navigate('/lost-found')}>更多</a>}>
            <List dataSource={data.lostFound} renderItem={(item: any) => (
              <List.Item><Tag color={item.type === 'lost' ? 'red' : 'green'}>{item.type === 'lost' ? '寻物' : '拾到'}</Tag><Text>{item.title}</Text></List.Item>
            )} />
          </Card>
        </Col>
        <Col span={8}>
          <Card title={<><ShopOutlined /> 二手市场</>} size="small" extra={<a onClick={() => navigate('/marketplace')}>更多</a>}>
            <List dataSource={data.marketItems} renderItem={(item: any) => (
              <List.Item><Text>{item.title}</Text><Text type="danger" style={{ marginLeft: 'auto' }}>¥{item.price}</Text></List.Item>
            )} />
          </Card>
        </Col>
        <Col span={8}>
          <Card title={<><FileTextOutlined /> 学习资源</>} size="small" extra={<a onClick={() => navigate('/resources')}>更多</a>}>
            <List dataSource={data.resources} renderItem={(item: any) => (
              <List.Item><Text>{item.title}</Text><Text type="secondary" style={{ marginLeft: 'auto' }}>{item.download_count}次下载</Text></List.Item>
            )} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
