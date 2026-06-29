import { useEffect, useState } from 'react';
import { Card, Typography, Avatar, Button, Space, Input, List, message, Spin, Tag, Divider } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { LikeOutlined, LikeFilled, EyeOutlined, MessageOutlined, UserOutlined } from '@ant-design/icons';
import request from '../../api/request';
import { useAuthStore } from '../../stores/useAuthStore';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuthStore();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchPost = () => {
    request.get(`/posts/${id}`).then((res: any) => setPost(res.data)).finally(() => setLoading(false));
    request.get(`/posts/${id}/comments`).then((res: any) => setComments(res.data?.list || []));
  };

  useEffect(() => { fetchPost(); }, [id]);

  const handleLike = async () => {
    if (!isLoggedIn) return message.warning('请先登录');
    try {
      if (post.isLiked) {
        await request.delete(`/posts/${id}/like`);
        setPost({ ...post, isLiked: false, like_count: post.like_count - 1 });
      } else {
        await request.post(`/posts/${id}/like`);
        setPost({ ...post, isLiked: true, like_count: post.like_count + 1 });
      }
    } catch (err: any) { message.error(err.message); }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    try {
      await request.post(`/posts/${id}/comments`, { content: commentText });
      message.success('评论成功');
      setCommentText('');
      fetchPost();
    } catch (err: any) { message.error(err.message); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>;
  if (!post) return <div style={{ textAlign: 'center', padding: 100 }}>帖子不存在</div>;

  return (
    <div className="page-container" style={{ maxWidth: 800 }}>
      <Card>
        <Title level={3}>{post.title}</Title>
        <Space style={{ marginBottom: 16 }}>
          <Avatar src={post.author?.avatar_url} icon={<UserOutlined />} />
          <Text strong>{post.author?.nickname}</Text>
          <Text type="secondary">{post.author?.department}</Text>
          <Text type="secondary">{dayjs(post.created_at).format('YYYY-MM-DD HH:mm')}</Text>
          <Tag>{post.board?.name}</Tag>
        </Space>
        <Paragraph style={{ whiteSpace: 'pre-wrap', fontSize: 15, lineHeight: 1.8 }}>{post.content}</Paragraph>
        <Divider />
        <Space size="large">
          <Button type={post.isLiked ? 'primary' : 'default'} icon={post.isLiked ? <LikeFilled /> : <LikeOutlined />} onClick={handleLike}>{post.like_count} 赞</Button>
          <span><EyeOutlined /> {post.view_count} 浏览</span>
          <span><MessageOutlined /> {post.comment_count} 评论</span>
        </Space>
      </Card>

      <Card title={`评论 (${post.comment_count})`} style={{ marginTop: 16 }}>
        {isLoggedIn && (
          <div style={{ marginBottom: 16 }}>
            <TextArea rows={3} value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="写下你的评论..." />
            <Button type="primary" style={{ marginTop: 8 }} onClick={handleComment} disabled={!commentText.trim()}>提交评论</Button>
          </div>
        )}
        <List
          dataSource={comments}
          renderItem={(item: any) => (
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar src={item.author?.avatar_url} icon={<UserOutlined />} />}
                title={<Space><Text strong>{item.author?.nickname}</Text><Text type="secondary">{dayjs(item.created_at).format('MM-DD HH:mm')}</Text></Space>}
                description={item.content}
              />
              {item.replies?.map((r: any) => (
                <div key={r.id} style={{ marginLeft: 48, marginTop: 8, padding: '8px 12px', background: '#f9f9f9', borderRadius: 6 }}>
                  <Space><Text strong>{r.author?.nickname}</Text><Text type="secondary">{dayjs(r.created_at).format('MM-DD HH:mm')}</Text></Space>
                  <div>{r.content}</div>
                </div>
              ))}
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}
