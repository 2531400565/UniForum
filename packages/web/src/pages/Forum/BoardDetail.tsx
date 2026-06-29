import { useEffect, useState } from 'react';
import { List, Typography, Tag, Button, Pagination, Spin, Space } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { EyeOutlined, LikeOutlined, MessageOutlined, PushpinOutlined } from '@ant-design/icons';
import request from '../../api/request';
import { useAuthStore } from '../../stores/useAuthStore';
import dayjs from 'dayjs';

export default function BoardDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const [board, setBoard] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      request.get(`/boards/${id}`),
      request.get('/posts', { params: { boardId: id, page, pageSize: 15 } }),
    ]).then(([b, p]: any[]) => {
      setBoard(b.data);
      setPosts(p.data?.list || []);
      setTotal(p.data?.total || 0);
    }).finally(() => setLoading(false));
  }, [id, page]);

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>;

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>{board?.name}</Typography.Title>
          <Typography.Text type="secondary">{board?.description}</Typography.Text>
        </div>
        {isLoggedIn && <Button type="primary" onClick={() => navigate('/forum/create', { state: { boardId: Number(id) } })}>发帖</Button>}
      </div>
      <List
        dataSource={posts}
        renderItem={(item: any) => (
          <List.Item style={{ cursor: 'pointer', background: '#fff', padding: '12px 16px', marginBottom: 8, borderRadius: 8 }} onClick={() => navigate(`/forum/post/${item.id}`)}>
            <List.Item.Meta
              title={<Space>{item.type === 'pinned' && <Tag color="orange">置顶</Tag>}{item.is_essential && <Tag color="gold">精华</Tag>}<span>{item.title}</span></Space>}
              description={<Space size="large">
                <span>{item.author?.nickname}</span>
                <span>{dayjs(item.created_at).format('YYYY-MM-DD HH:mm')}</span>
              </Space>}
            />
            <Space size="large">
              <span><EyeOutlined /> {item.view_count}</span>
              <span><LikeOutlined /> {item.like_count}</span>
              <span><MessageOutlined /> {item.comment_count}</span>
            </Space>
          </List.Item>
        )}
      />
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <Pagination current={page} total={total} pageSize={15} onChange={setPage} />
      </div>
    </div>
  );
}
