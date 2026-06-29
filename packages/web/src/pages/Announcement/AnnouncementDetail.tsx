import { useEffect, useState } from 'react';
import { Card, Typography, Tag, Spin, Space } from 'antd';
import { useParams } from 'react-router-dom';
import request from '../../api/request';
import dayjs from 'dayjs';

export default function AnnouncementDetail() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const typeLabels: any = { notice: '学校通知', lecture: '学术讲座', club: '社团活动', other: '其他' };

  useEffect(() => {
    request.get(`/announcements/${id}`).then((res: any) => setData(res.data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>;
  if (!data) return <div style={{ textAlign: 'center', padding: 100 }}>公告不存在</div>;

  return (
    <div className="page-container" style={{ maxWidth: 800 }}>
      <Card>
        <Typography.Title level={3}>{data.title}</Typography.Title>
        <Space style={{ marginBottom: 16 }}>
          <Tag color="blue">{typeLabels[data.type]}</Tag>
          <Typography.Text type="secondary">{data.publisher?.nickname}</Typography.Text>
          <Typography.Text type="secondary">{dayjs(data.created_at).format('YYYY-MM-DD HH:mm')}</Typography.Text>
        </Space>
        <Typography.Paragraph style={{ whiteSpace: 'pre-wrap', fontSize: 15, lineHeight: 1.8 }}>{data.content}</Typography.Paragraph>
      </Card>
    </div>
  );
}
