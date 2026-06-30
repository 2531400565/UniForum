import { useEffect, useState } from 'react';
import { List, Input, Button, Avatar, Typography, Space, message, Popconfirm } from 'antd';
import { UserOutlined, SendOutlined, DeleteOutlined, MessageOutlined } from '@ant-design/icons';
import request from '../../api/request';
import { useAuthStore } from '../../stores/useAuthStore';
import dayjs from 'dayjs';

const { Text } = Typography;

interface CommentItem {
  id: number;
  content: string;
  author: { id: number; nickname: string; avatar_url: string | null };
  replyTo?: { id: number; nickname: string };
  created_at: string;
  replies?: CommentItem[];
  _rootId?: number; // 追踪顶级评论ID
}

interface ItemCommentProps {
  targetType: 'marketplace' | 'lost_found';
  targetId: number;
}

export default function ItemComment({ targetType, targetId }: ItemCommentProps) {
  const { user, isLoggedIn } = useAuthStore();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [replyTo, setReplyTo] = useState<CommentItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = () => {
    setLoading(true);
    request.get(`/item-comments/${targetType}/${targetId}`, { params: { page: 1, pageSize: 100 } })
      .then((res: any) => {
        const list = (res.data?.list || []).map((c: CommentItem) => ({ ...c, _rootId: c.id }));
        setComments(list);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchComments(); }, [targetType, targetId]);

  const handleSubmit = async () => {
    if (!content.trim()) return message.warning('请输入评论内容');
    setSubmitting(true);
    try {
      await request.post(`/item-comments/${targetType}/${targetId}`, {
        content: content.trim(),
        parentId: replyTo?._rootId || replyTo?.id,
        replyToId: replyTo?.author?.id,
      });
      message.success('评论成功');
      setContent('');
      setReplyTo(null);
      fetchComments();
    } catch (err: any) {
      message.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await request.delete(`/item-comments/${id}`);
      message.success('删除成功');
      fetchComments();
    } catch (err: any) {
      message.error(err.message);
    }
  };

  const renderComment = (item: CommentItem, isReply = false) => (
    <List.Item
      key={item.id}
      style={{ paddingLeft: isReply ? 48 : 0 }}
      actions={
        isLoggedIn ? [
          <Button key="reply" type="text" size="small" icon={<MessageOutlined />} onClick={() => setReplyTo({ ...item, _rootId: item._rootId || item.id })}>
            回复
          </Button>,
          user?.id === item.author?.id && (
            <Popconfirm key="delete" title="确定删除？" onConfirm={() => handleDelete(item.id)}>
              <Button type="text" size="small" danger icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          ),
        ] : undefined
      }
    >
      <List.Item.Meta
        avatar={<Avatar src={item.author?.avatar_url} icon={<UserOutlined />} size="small" />}
        title={
          <Space>
            <Text strong>{item.author?.nickname}</Text>
            {item.replyTo && <Text type="secondary">回复 {item.replyTo.nickname}</Text>}
            <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(item.created_at).format('MM-DD HH:mm')}</Text>
          </Space>
        }
        description={item.content}
      />
    </List.Item>
  );

  return (
    <div>
      <Typography.Title level={5} style={{ marginTop: 24 }}>评论 ({comments.length})</Typography.Title>
      {isLoggedIn && (
        <div style={{ marginBottom: 16 }}>
          {replyTo && (
            <div style={{ marginBottom: 8, padding: '4px 8px', background: '#f5f5f5', borderRadius: 4 }}>
              <Text type="secondary">回复 {replyTo.author?.nickname}：</Text>
              <Button type="link" size="small" onClick={() => setReplyTo(null)}>取消</Button>
            </div>
          )}
          <Space.Compact style={{ width: '100%' }}>
            <Input.TextArea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="写下你的评论..."
              autoSize={{ minRows: 2, maxRows: 4 }}
            />
            <Button type="primary" icon={<SendOutlined />} loading={submitting} onClick={handleSubmit} style={{ height: 'auto' }}>
              发送
            </Button>
          </Space.Compact>
        </div>
      )}
      <List
        loading={loading}
        dataSource={comments}
        renderItem={(item) => (
          <>
            {renderComment(item, false)}
            {item.replies?.map(reply => renderComment({ ...reply, _rootId: item.id }, true))}
          </>
        )}
        locale={{ emptyText: '暂无评论' }}
      />
    </div>
  );
}
