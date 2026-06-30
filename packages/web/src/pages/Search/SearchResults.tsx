import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Typography, Tabs, List, Tag, Card, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import request from '../../api/request';
import dayjs from 'dayjs';
import { ListSkeleton } from '../../components/Skeleton';

export default function SearchResults() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const keyword = params.get('keyword') || '';
  const [data, setData] = useState<any>({ posts: [], questions: [], resources: [], announcements: [], lostFound: [], marketItems: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!keyword) return;
    setLoading(true);
    request.get('/search', { params: { keyword } }).then((res: any) => setData(res.data || {})).finally(() => setLoading(false));
  }, [keyword]);

  if (loading) return <ListSkeleton rows={8} />;

  const total = (data.posts?.length || 0) + (data.questions?.length || 0) + (data.resources?.length || 0) + (data.announcements?.length || 0) + (data.lostFound?.length || 0) + (data.marketItems?.length || 0);

  const items = [
    { key: 'posts', label: `帖子 (${data.posts?.length || 0})`, children: (
      <List dataSource={data.posts} renderItem={(item: any) => (
        <Card size="small" style={{ marginBottom: 8, cursor: 'pointer' }} onClick={() => navigate(`/forum/post/${item.id}`)}>
          <Typography.Text strong>{item.title}</Typography.Text>
          <Typography.Text type="secondary" style={{ marginLeft: 16 }}>{item.author?.nickname} · {dayjs(item.created_at).format('MM-DD')}</Typography.Text>
        </Card>
      )} />
    )},
    { key: 'questions', label: `问答 (${data.questions?.length || 0})`, children: (
      <List dataSource={data.questions} renderItem={(item: any) => (
        <Card size="small" style={{ marginBottom: 8, cursor: 'pointer' }} onClick={() => navigate(`/qa/${item.id}`)}>
          <Typography.Text strong>{item.title}</Typography.Text>
          <Typography.Text type="secondary" style={{ marginLeft: 16 }}>{item.answer_count}回答</Typography.Text>
        </Card>
      )} />
    )},
    { key: 'resources', label: `资源 (${data.resources?.length || 0})`, children: (
      <List dataSource={data.resources} renderItem={(item: any) => (
        <Card size="small" style={{ marginBottom: 8 }}>
          <Typography.Text strong>{item.title}</Typography.Text>
          <Tag style={{ marginLeft: 8 }}>{item.file_type}</Tag>
        </Card>
      )} />
    )},
    { key: 'announcements', label: `公告 (${data.announcements?.length || 0})`, children: (
      <List dataSource={data.announcements} renderItem={(item: any) => (
        <Card size="small" style={{ marginBottom: 8, cursor: 'pointer' }} onClick={() => navigate(`/announcements/${item.id}`)}>
          <Tag color="blue">{item.type === 'notice' ? '通知' : item.type === 'lecture' ? '讲座' : '社团'}</Tag>
          <Typography.Text strong>{item.title}</Typography.Text>
        </Card>
      )} />
    )},
    { key: 'lostFound', label: `失物招领 (${data.lostFound?.length || 0})`, children: (
      <List dataSource={data.lostFound} renderItem={(item: any) => (
        <Card size="small" style={{ marginBottom: 8, cursor: 'pointer' }} onClick={() => navigate(`/lost-found/${item.id}`)}>
          <Tag color={item.type === 'lost' ? 'red' : 'green'}>{item.type === 'lost' ? '寻物' : '拾到'}</Tag>
          <Typography.Text strong>{item.title}</Typography.Text>
          <Typography.Text type="secondary" style={{ marginLeft: 16 }}>{item.author?.nickname} · {dayjs(item.created_at).format('MM-DD')}</Typography.Text>
        </Card>
      )} />
    )},
    { key: 'marketplace', label: `二手市场 (${data.marketItems?.length || 0})`, children: (
      <List dataSource={data.marketItems} renderItem={(item: any) => (
        <Card size="small" style={{ marginBottom: 8, cursor: 'pointer' }} onClick={() => navigate(`/marketplace/${item.id}`)}>
          <Typography.Text strong>{item.title}</Typography.Text>
          <Typography.Text type="danger" style={{ marginLeft: 8 }}>¥{item.price}</Typography.Text>
          <Typography.Text type="secondary" style={{ marginLeft: 16 }}>{item.seller?.nickname} · {dayjs(item.created_at).format('MM-DD')}</Typography.Text>
        </Card>
      )} />
    )},
  ];

  return (
    <div className="page-container">
      <Typography.Title level={3}><SearchOutlined /> 搜索结果："{keyword}" <Typography.Text type="secondary" style={{ fontSize: 14 }}>共 {total} 条</Typography.Text></Typography.Title>
      <Tabs items={items} defaultActiveKey="posts" />
    </div>
  );
}
