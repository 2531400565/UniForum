import { useEffect, useState } from 'react';
import { Card, Typography, Avatar, Button, Space, Input, List, message, Spin, Tag, Divider } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { LikeOutlined, LikeFilled, EyeOutlined, MessageOutlined, UserOutlined, StarOutlined, StarFilled } from '@ant-design/icons';
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

  const handleFavorite = async () => {
    if (!isLoggedIn) return message.warning('请先登录');
    try {
      if (post.isFavorited) {
        await request.delete(`/posts/${id}/favorite`);
        setPost({ ...post, isFavorited: false });
        message.success('已取消收藏');
      } else {
        await request.post(`/posts/${id}/favorite`);
        setPost({ ...post, isFavorited: true });
        message.success('收藏成功');
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

  const handleCommentLike = async (commentId: number, isLiked: boolean) => {
    if (!isLoggedIn) return message.warning('请先登录');
    try {
      if (isLiked) {
        await request.delete(`/comments/${commentId}/like`);
      } else {
        await request.post(`/comments/${commentId}/like`);
      }
      fetchPost();
    } catch (err: any) { message.error(err.message); }
  };

  const handleTogglePin = async () => {
    try {
      await request.put(`/posts/${id}/pin`);
      message.success('操作成功');
      fetchPost();
    } catch (err: any) { message.error(err.message); }
  };

  const handleToggleEssential = async () => {
    try {
      await request.put(`/posts/${id}/essential`);
      message.success('操作成功');
      fetchPost();
    } catch (err: any) { message.error(err.message); }
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'moderator';

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>;
  if (!post) return <div style={{ textAlign: 'center', padding: 100 }}>帖子不存在</div>;

  return (
    <div className="page-container" style={{ maxWidth: 800 }}>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          {post.type === 'pinned' && <Tag color="orange">置顶</Tag>}
          {post.is_essential && <Tag color="gold">精华</Tag>}
          {isAdmin && (
            <Space size="small">
              <Button size="small" type={post.type === 'pinned' ? 'primary' : 'default'} onClick={handleTogglePin}>{post.type === 'pinned' ? '取消置顶' : '置顶'}</Button>
              <Button size="small" type={post.is_essential ? 'primary' : 'default'} onClick={handleToggleEssential}>{post.is_essential ? '取消精华' : '标为精华'}</Button>
            </Space>
          )}
        </div>
        <Title level={3}>{post.title}</Title>
        <Space style={{ marginBottom: 16 }}>
          <Avatar src={post.author?.avatar_url} icon={<UserOutlined />} />
          <Text strong>{post.author?.nickname}</Text>
          <Text type="secondary">{post.author?.department}</Text>
          <Text type="secondary">{dayjs(post.created_at).format('YYYY-MM-DD HH:mm')}</Text>
          <Tag>{post.board?.name}</Tag>
        </Space>
        <div className="post-content" style={{ fontSize: 15, lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: post.content }} />
        <Divider />
        <Space size="large">
          <Button type={post.isLiked ? 'primary' : 'default'} icon={post.isLiked ? <LikeFilled /> : <LikeOutlined />} onClick={handleLike}>{post.like_count} 赞</Button>
          <Button type={post.isFavorited ? 'primary' : 'default'} danger={post.isFavorited} icon={post.isFavorited ? <StarFilled /> : <StarOutlined />} onClick={handleFavorite}>{post.isFavorited ? '已收藏' : '收藏'}</Button>
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
              <div style={{ width: '100%' }}>
                <List.Item.Meta
                  avatar={<Avatar src={item.author?.avatar_url} icon={<UserOutlined />} />}
                  title={<Space><Text strong>{item.author?.nickname}</Text><Text type="secondary">{dayjs(item.created_at).format('MM-DD HH:mm')}</Text></Space>}
                  description={item.content}
                />
                <div style={{ marginLeft: 48, marginTop: 4 }}>
                  <Button size="small" type="text" icon={item.isLiked ? <LikeFilled style={{ color: '#1677ff' }} /> : <LikeOutlined />} onClick={() => handleCommentLike(item.id, item.isLiked)}>{item.like_count || 0}</Button>
                </div>
                {item.replies?.map((r: any) => (
                  <div key={r.id} style={{ marginLeft: 48, marginTop: 8, padding: '8px 12px', background: '#f9f9f9', borderRadius: 6 }}>
                    <Space><Text strong>{r.author?.nickname}</Text><Text type="secondary">{dayjs(r.created_at).format('MM-DD HH:mm')}</Text></Space>
                    <div>{r.content}</div>
                    <Button size="small" type="text" icon={r.isLiked ? <LikeFilled style={{ color: '#1677ff' }} /> : <LikeOutlined />} style={{ marginTop: 4 }} onClick={() => handleCommentLike(r.id, r.isLiked)}>{r.like_count || 0}</Button>
                  </div>
                ))}
              </div>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}
