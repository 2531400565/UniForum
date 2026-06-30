import { useEffect, useState } from 'react';
import { List, Typography, Tag, Pagination, Card, Tabs } from 'antd';
import { useNavigate } from 'react-router-dom';
import { NotificationOutlined } from '@ant-design/icons';
import request from '../../api/request';
import dayjs from 'dayjs';
import { ListSkeleton } from '../../components/Skeleton';

const typeLabels: any = { notice: '学校通知', lecture: '学术讲座', club: '社团活动', other: '其他' };
const typeColors: any = { notice: 'red', lecture: 'blue', club: 'green', other: 'default' };

export default function AnnouncementList() {
  const navigate = useNavigate();
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    request.get('/announcements', { params: { page, pageSize: 15, type: type || undefined } }).then((res: any) => {
      setData(res.data?.list || []);
      setTotal(res.data?.total || 0);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [page, type]);

  if (loading) return <ListSkeleton rows={8} />;

  return (
    <div className="page-container">
      <Typography.Title level={3}><NotificationOutlined /> 校园公告</Typography.Title>
      <Tabs activeKey={type} onChange={(k) => { setType(k); setPage(1); }} items={[
        { key: '', label: '全部' },
        { key: 'notice', label: '学校通知' },
        { key: 'lecture', label: '学术讲座' },
        { key: 'club', label: '社团活动' },
        { key: 'other', label: '其他' },
      ]} style={{ marginBottom: 16 }} />
      <List dataSource={data} renderItem={(item: any) => (
        <Card style={{ marginBottom: 12, cursor: 'pointer' }} hoverable onClick={() => navigate(`/announcements/${item.id}`)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Tag color={typeColors[item.type]}>{typeLabels[item.type]}</Tag>
            <Typography.Text strong style={{ flex: 1 }}>{item.title}</Typography.Text>
            <Typography.Text type="secondary">{dayjs(item.created_at).format('YYYY-MM-DD')}</Typography.Text>
          </div>
        </Card>
      )} />
      <div style={{ textAlign: 'center', marginTop: 16 }}><Pagination current={page} total={total} pageSize={15} onChange={setPage} /></div>
    </div>
  );
}
