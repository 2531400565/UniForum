import { useEffect, useState } from 'react';
import { List, Typography, Tag, Pagination, Spin, Card } from 'antd';
import { useNavigate } from 'react-router-dom';
import { NotificationOutlined } from '@ant-design/icons';
import request from '../../api/request';
import dayjs from 'dayjs';

const typeLabels: any = { notice: '学校通知', lecture: '学术讲座', club: '社团活动', other: '其他' };
const typeColors: any = { notice: 'red', lecture: 'blue', club: 'green', other: 'default' };

export default function AnnouncementList() {
  const navigate = useNavigate();
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    request.get('/announcements', { params: { page, pageSize: 15 } }).then((res: any) => {
      setData(res.data?.list || []);
      setTotal(res.data?.total || 0);
    }).finally(() => setLoading(false));
  }, [page]);

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>;

  return (
    <div className="page-container">
      <Typography.Title level={3}><NotificationOutlined /> 校园公告</Typography.Title>
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
