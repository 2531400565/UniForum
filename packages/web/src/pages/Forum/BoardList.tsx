import { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Tag, Button, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import { PlusOutlined, MessageOutlined } from '@ant-design/icons';
import request from '../../api/request';
import { useAuthStore } from '../../stores/useAuthStore';

const categoryLabels: any = { department: '院系', interest: '兴趣', academic: '学术' };
const categoryColors: any = { department: 'blue', interest: 'green', academic: 'purple' };

export default function BoardList() {
  const navigate = useNavigate();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const [boards, setBoards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    request.get('/boards').then((res: any) => setBoards(res.data || [])).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>;

  const grouped = { department: [] as any[], interest: [] as any[], academic: [] as any[] };
  boards.forEach(b => { if (grouped[b.category]) grouped[b.category].push(b); });

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={3}><MessageOutlined /> 论坛版块</Typography.Title>
        {isLoggedIn && <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/forum/create')}>发帖</Button>}
      </div>
      {Object.entries(grouped).map(([cat, items]) => items.length > 0 && (
        <div key={cat} style={{ marginBottom: 24 }}>
          <Typography.Title level={5}><Tag color={categoryColors[cat]}>{categoryLabels[cat]}</Tag></Typography.Title>
          <Row gutter={[16, 16]}>
            {items.map((board: any) => (
              <Col span={8} key={board.id}>
                <Card hoverable onClick={() => navigate(`/forum/board/${board.id}`)} className="card-hover">
                  <Card.Meta title={board.name} description={<>
                    <div>{board.description}</div>
                    <div style={{ marginTop: 8, color: '#999' }}>{board.post_count} 帖子</div>
                  </>} />
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      ))}
    </div>
  );
}
