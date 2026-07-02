import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Typography, Tabs, List, Tag, Card, Space, Button, Pagination, message } from 'antd';
import { SearchOutlined, DownloadOutlined } from '@ant-design/icons';
import request from '../../api/request';
import dayjs from 'dayjs';
import { ListSkeleton } from '../../components/Skeleton';

export default function SearchResults() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const keyword = params.get('keyword') || '';
  const [data, setData] = useState<any>({ posts: [], questions: [], resources: [], announcements: [], lostFound: [], marketItems: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // 关键词高亮
  const highlightText = (text: string, kw: string) => {
    if (!kw || !text) return text;
    const parts = text.split(new RegExp(`(${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === kw.toLowerCase()
        ? <Typography.Text key={i} mark>{part}</Typography.Text>
        : <span key={i}>{part}</span>
    );
  };

  useEffect(() => {
    if (!keyword) return;
    setLoading(true);
    setCurrentPage(1);
    request.get('/search', { params: { keyword } }).then((res: any) => setData(res.data || {})).finally(() => setLoading(false));
  }, [keyword]);

  // 当前 Tab 的数据
  const tabDataMap: any = {
    posts: data.posts, questions: data.questions, resources: data.resources,
    announcements: data.announcements, lostFound: data.lostFound, marketplace: data.marketItems,
  };
  const currentList = tabDataMap[activeTab] || [];
  const pagedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return currentList.slice(start, start + pageSize);
  }, [currentList, currentPage]);

  if (loading) return <ListSkeleton rows={8} />;

  const total = (data.posts?.length || 0) + (data.questions?.length || 0) + (data.resources?.length || 0) + (data.announcements?.length || 0) + (data.lostFound?.length || 0) + (data.marketItems?.length || 0);

  const items = [
    { key: 'posts', label: `帖子 (${data.posts?.length || 0})`, children: (
      <List dataSource={pagedData} renderItem={(item: any) => (
        <Card size="small" style={{ marginBottom: 8, cursor: 'pointer' }} onClick={() => navigate(`/forum/post/${item.id}`)}>
          {highlightText(item.title, keyword)}
          <Typography.Text type="secondary" style={{ marginLeft: 16 }}>{item.author?.nickname} · {dayjs(item.created_at).format('MM-DD')}</Typography.Text>
        </Card>
      )} />
    )},
    { key: 'questions', label: `问答 (${data.questions?.length || 0})`, children: (
      <List dataSource={pagedData} renderItem={(item: any) => (
        <Card size="small" style={{ marginBottom: 8, cursor: 'pointer' }} onClick={() => navigate(`/qa/${item.id}`)}>
          {highlightText(item.title, keyword)}
          <Typography.Text type="secondary" style={{ marginLeft: 16 }}>{item.answer_count}回答</Typography.Text>
        </Card>
      )} />
    )},
    { key: 'resources', label: `资源 (${data.resources?.length || 0})`, children: (
      <List dataSource={pagedData} renderItem={(item: any) => (
        <Card size="small" style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/resources')}>
            <div>
              {highlightText(item.title, keyword)}
              <Tag style={{ marginLeft: 8 }}>{item.file_type}</Tag>
              <Typography.Text type="secondary" style={{ marginLeft: 16 }}>{item.uploader?.nickname} · {dayjs(item.created_at).format('MM-DD')}</Typography.Text>
            </div>
            <Button size="small" type="primary" icon={<DownloadOutlined />} onClick={async (e) => {
              e.stopPropagation();
              try {
                const token = localStorage.getItem('accessToken');
                const resp = await fetch(`/api/v1/resources/${item.id}/download`, {
                  headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                if (!resp.ok) throw new Error('下载失败');
                const blob = await resp.blob();
                let filename = item.file_name || `resource_${item.id}`;
                const disposition = resp.headers.get('Content-Disposition');
                if (disposition) {
                  const match = disposition.match(/filename\*=UTF-8''(.+?)(?:;|$)/);
                  if (match) filename = decodeURIComponent(match[1]);
                }
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                message.success('下载成功');
              } catch (err: any) { message.error('下载失败'); }
            }}>下载</Button>
          </div>
        </Card>
      )} />
    )},
    { key: 'announcements', label: `公告 (${data.announcements?.length || 0})`, children: (
      <List dataSource={pagedData} renderItem={(item: any) => (
        <Card size="small" style={{ marginBottom: 8, cursor: 'pointer' }} onClick={() => navigate(`/announcements/${item.id}`)}>
          <Tag color="blue">{item.type === 'notice' ? '通知' : item.type === 'lecture' ? '讲座' : '社团'}</Tag>
          {highlightText(item.title, keyword)}
        </Card>
      )} />
    )},
    { key: 'lostFound', label: `失物招领 (${data.lostFound?.length || 0})`, children: (
      <List dataSource={pagedData} renderItem={(item: any) => (
        <Card size="small" style={{ marginBottom: 8, cursor: 'pointer' }} onClick={() => navigate(`/lost-found/${item.id}`)}>
          <Tag color={item.type === 'lost' ? 'red' : 'green'}>{item.type === 'lost' ? '寻物' : '拾到'}</Tag>
          {highlightText(item.title, keyword)}
          <Typography.Text type="secondary" style={{ marginLeft: 16 }}>{item.author?.nickname} · {dayjs(item.created_at).format('MM-DD')}</Typography.Text>
        </Card>
      )} />
    )},
    { key: 'marketplace', label: `二手市场 (${data.marketItems?.length || 0})`, children: (
      <List dataSource={pagedData} renderItem={(item: any) => (
        <Card size="small" style={{ marginBottom: 8, cursor: 'pointer' }} onClick={() => navigate(`/marketplace/${item.id}`)}>
          {highlightText(item.title, keyword)}
          <Typography.Text type="danger" style={{ marginLeft: 8 }}>¥{item.price}</Typography.Text>
          <Typography.Text type="secondary" style={{ marginLeft: 16 }}>{item.seller?.nickname} · {dayjs(item.created_at).format('MM-DD')}</Typography.Text>
        </Card>
      )} />
    )},
  ];

  return (
    <div className="page-container">
      <Typography.Title level={3}><SearchOutlined /> 搜索结果："{keyword}" <Typography.Text type="secondary" style={{ fontSize: 14 }}>共 {total} 条</Typography.Text></Typography.Title>
      <Tabs items={items} activeKey={activeTab} onChange={(k) => { setActiveTab(k); setCurrentPage(1); }} />
      {currentList.length > pageSize && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Pagination current={currentPage} total={currentList.length} pageSize={pageSize} onChange={setCurrentPage} showSizeChanger={false} showTotal={(t) => `共 ${t} 条结果`} />
        </div>
      )}
    </div>
  );
}
