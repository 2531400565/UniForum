import { useEffect, useState, useRef } from 'react';
import { Card, Typography, Avatar, Button, Space, Input, List, message, Tag, Divider, Popconfirm } from 'antd';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { LikeOutlined, LikeFilled, EyeOutlined, MessageOutlined, UserOutlined, StarOutlined, StarFilled, EditOutlined, DeleteOutlined, CommentOutlined } from '@ant-design/icons';
import request from '../../api/request';
import { useAuthStore } from '../../stores/useAuthStore';
import { io, Socket } from 'socket.io-client';
import dayjs from 'dayjs';
import DOMPurify from 'dompurify';
import { PostDetailSkeleton } from '../../components/Skeleton';

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
  const [commentPage, setCommentPage] = useState(1);
  const [commentTotal, setCommentTotal] = useState(0);
  const [commentLoading, setCommentLoading] = useState(false);
  const [replyTo, setReplyTo] = useState<any>(null);
  const socketRef = useRef<Socket | null>(null);

  const fetchPost = () => {
    request.get(`/posts/${id}`).then((res: any) => setPost(res.data)).finally(() => setLoading(false));
    fetchComments(1);
  };

  const fetchComments = (page: number) => {
    setCommentLoading(true);
    request.get(`/posts/${id}/comments`, { params: { page, pageSize: 10 } })
      .then((res: any) => {
        const newList = (res.data?.list || []).map((c: any) => ({ ...c, _rootId: c.id }));
        setComments(prev => page === 1 ? newList : [...prev, ...newList]);
        setCommentTotal(res.data?.total || 0);
        setCommentPage(page);
      })
      .catch(() => {})
      .finally(() => setCommentLoading(false));
  };

  useEffect(() => {
    fetchPost();

    // Socket.IO: 加入帖子房间，实时接收新评论
    const token = localStorage.getItem('accessToken');
    if (token) {
      const socket = io(window.location.origin, {
        auth: { token },
        path: '/socket.io',
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        socket.emit('joinPost', Number(id));
      });

      socket.on('newComment', (data: any) => {
        if (data.postId === Number(id)) {
          // 刷新评论列表
          fetchComments(1);
          // 更新帖子评论数
          setPost((prev: any) => prev ? { ...prev, comment_count: (prev.comment_count || 0) + 1 } : prev);
        }
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leavePost', Number(id));
        socketRef.current.disconnect();
      }
    };
  }, [id]);

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
      await request.post(`/posts/${id}/comments`, {
        content: commentText,
        parentId: replyTo?._rootId || replyTo?.parentId,
        replyToId: replyTo?.author?.id,
      });
      message.success(replyTo ? '回复成功' : '评论成功');
      setCommentText('');
      setReplyTo(null);
      fetchPost();
    } catch (err: any) { message.error(err.message); }
  };

  // Ctrl+Enter 快捷评论
  const handleCommentKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'Enter' && commentText.trim()) {
      handleComment();
    }
  };

  const handleCommentLike = async (commentId: number, isLiked: boolean) => {
    if (!isLoggedIn) return message.warning('请先登录');
    try {
      if (isLiked) {
        await request.delete(`/comments/${commentId}/like`);
      } else {
        await request.post(`/comments/${commentId}/like`);
      }
      // 乐观更新：立即切换点赞状态，无需重新拉取全部数据
      setComments(prev => prev.map(c => {
        if (c.id === commentId) {
          return { ...c, isLiked: !isLiked, like_count: c.like_count + (isLiked ? -1 : 1) };
        }
        return { ...c, replies: (c.replies || []).map((r: any) =>
          r.id === commentId ? { ...r, isLiked: !isLiked, like_count: r.like_count + (isLiked ? -1 : 1) } : r
        )};
      }));
    } catch (err: any) { message.error(err.message); }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      await request.delete(`/comments/${commentId}`);
      message.success('删除成功');
      // 从列表中移除已删除的评论
      setComments(prev => {
        const filtered = prev.filter(c => c.id !== commentId);
        // 如果删除的是一级评论，也移除其子评论
        return filtered.map(c => ({ ...c, replies: (c.replies || []).filter((r: any) => r.id !== commentId) }));
      });
      // 更新帖子评论数
      setPost((prev: any) => prev ? { ...prev, comment_count: Math.max(0, (prev.comment_count || 1) - 1) } : prev);
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
  const isAuthor = user?.id === post?.author_id;

  if (loading) return <PostDetailSkeleton />;
  if (!post) return <div style={{ textAlign: 'center', padding: 100 }}>帖子不存在</div>;

  return (
    <div className="page-container" style={{ maxWidth: 800 }}>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          {post.type === 'pinned' && <Tag color="orange">置顶</Tag>}
          {post.is_essential && <Tag color="gold">精华</Tag>}
          {(isAuthor || isAdmin) && (
            <Button size="small" icon={<EditOutlined />} onClick={() => navigate(`/forum/edit/${post.id}`)}>编辑</Button>
          )}
          {isAdmin && (
            <Space size="small">
              <Button size="small" type={post.type === 'pinned' ? 'primary' : 'default'} onClick={handleTogglePin}>{post.type === 'pinned' ? '取消置顶' : '置顶'}</Button>
              <Button size="small" type={post.is_essential ? 'primary' : 'default'} onClick={handleToggleEssential}>{post.is_essential ? '取消精华' : '标为精华'}</Button>
            </Space>
          )}
        </div>
        <Title level={3}>{post.title}</Title>
        <Space style={{ marginBottom: 16 }} wrap>
          <Avatar src={post.author?.avatar_url} icon={<UserOutlined />} />
          <Link to={`/profile/${post.author?.id}`}><Text strong>{post.author?.nickname}</Text></Link>
          <Text type="secondary">{post.author?.department}</Text>
          <Text type="secondary">{dayjs(post.created_at).format('YYYY-MM-DD HH:mm')}</Text>
          <Tag>{post.board?.name}</Tag>
          {post.tags?.map((tag: any) => <Tag key={tag.id} color="blue">{tag.name}</Tag>)}
        </Space>
        <div className="post-content" style={{ fontSize: 15, lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }} />
        <Divider />
        <Space size="large">
          <Button className="action-btn-animate" type={post.isLiked ? 'primary' : 'default'} icon={post.isLiked ? <LikeFilled /> : <LikeOutlined />} onClick={handleLike}>{post.like_count} 赞</Button>
          <Button className="action-btn-animate" type={post.isFavorited ? 'primary' : 'default'} danger={post.isFavorited} icon={post.isFavorited ? <StarFilled /> : <StarOutlined />} onClick={handleFavorite}>{post.isFavorited ? '已收藏' : '收藏'}</Button>
          <span><EyeOutlined /> {post.view_count} 浏览</span>
          <span><MessageOutlined /> {post.comment_count} 评论</span>
        </Space>
      </Card>

      <Card title={`评论 (${post.comment_count})`} style={{ marginTop: 16 }}>
        {isLoggedIn && (
          <div style={{ marginBottom: 16 }}>
            {replyTo && (
              <div style={{ marginBottom: 8, padding: '8px 12px', background: '#f0f5ff', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text type="secondary"><CommentOutlined /> 回复 {replyTo.author?.nickname}：{replyTo.content?.substring(0, 30)}{replyTo.content?.length > 30 ? '...' : ''}</Text>
                <Button type="link" size="small" onClick={() => setReplyTo(null)}>取消回复</Button>
              </div>
            )}
            <TextArea rows={3} value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={handleCommentKeyDown} placeholder={replyTo ? `回复 ${replyTo.author?.nickname}...` : "写下你的评论... (Ctrl+Enter 发布)"} />
            <Button type="primary" style={{ marginTop: 8 }} onClick={handleComment} disabled={!commentText.trim()}>{replyTo ? '回复' : '提交评论'}</Button>
          </div>
        )}
        <List
          loading={commentLoading && comments.length === 0}
          dataSource={comments}
          locale={{ emptyText: '暂无评论' }}
          renderItem={(item: any) => (
            <List.Item>
              <div style={{ width: '100%' }}>
                <List.Item.Meta
                  avatar={<Avatar src={item.author?.avatar_url} icon={<UserOutlined />} />}
                  title={<Space><Link to={`/profile/${item.author?.id}`}><Text strong>{item.author?.nickname}</Text></Link><Text type="secondary">{dayjs(item.created_at).format('MM-DD HH:mm')}</Text></Space>}
                  description={item.content}
                />
                <div style={{ marginLeft: 48, marginTop: 4 }}>
                  <Button size="small" type="text" icon={item.isLiked ? <LikeFilled style={{ color: '#1677ff' }} /> : <LikeOutlined />} onClick={() => handleCommentLike(item.id, item.isLiked)}>{item.like_count || 0}</Button>
                  {isLoggedIn && (
                    <Button size="small" type="text" icon={<CommentOutlined />} onClick={() => setReplyTo({ _rootId: item._rootId || item.id, parentId: item.id, author: item.author, content: item.content })} style={{ marginLeft: 8 }}>回复</Button>
                  )}
                  {(user?.id === item.author?.id || isAdmin) && (
                    <Popconfirm title="确定删除该评论？" onConfirm={() => handleDeleteComment(item.id)} okText="删除" cancelText="取消">
                      <Button size="small" type="text" danger icon={<DeleteOutlined />} style={{ marginLeft: 8 }}>删除</Button>
                    </Popconfirm>
                  )}
                </div>
                {item.replies?.map((r: any) => (
                  <div key={r.id} style={{ marginLeft: 48, marginTop: 8, padding: '8px 12px', background: '#f9f9f9', borderRadius: 6 }}>
                    <Space>
                      <Text strong>{r.author?.nickname}</Text>
                      {r.replyTo && <Text type="secondary">回复 {r.replyTo.nickname}</Text>}
                      <Text type="secondary">{dayjs(r.created_at).format('MM-DD HH:mm')}</Text>
                    </Space>
                    <div>{r.content}</div>
                    <div style={{ marginTop: 4 }}>
                      <Button size="small" type="text" icon={r.isLiked ? <LikeFilled style={{ color: '#1677ff' }} /> : <LikeOutlined />} onClick={() => handleCommentLike(r.id, r.isLiked)}>{r.like_count || 0}</Button>
                      {isLoggedIn && (
                        <Button size="small" type="text" icon={<CommentOutlined />} onClick={() => setReplyTo({ _rootId: item._rootId || item.id, parentId: item.id, author: r.author, content: r.content })} style={{ marginLeft: 8 }}>回复</Button>
                      )}
                      {(user?.id === r.author?.id || isAdmin) && (
                        <Popconfirm title="确定删除该回复？" onConfirm={() => handleDeleteComment(r.id)} okText="删除" cancelText="取消">
                          <Button size="small" type="text" danger icon={<DeleteOutlined />} style={{ marginLeft: 8 }}>删除</Button>
                        </Popconfirm>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </List.Item>
          )}
        />
        {comments.length < commentTotal && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Button onClick={() => fetchComments(commentPage + 1)} loading={commentLoading}>加载更多评论</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
