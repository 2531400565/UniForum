import { useEffect, useState } from 'react';
import { Card, Typography, Avatar, Button, Space, Input, List, message, Tag, Divider, Popconfirm } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { UserOutlined, CheckCircleOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import request from '../../api/request';
import { useAuthStore } from '../../stores/useAuthStore';
import dayjs from 'dayjs';
import { PostDetailSkeleton } from '../../components/Skeleton';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function QuestionDetail() {
  const { id } = useParams();
  const { user, isLoggedIn } = useAuthStore();
  const navigate = useNavigate();
  const [question, setQuestion] = useState<any>(null);
  const [answerText, setAnswerText] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchQuestion = () => {
    request.get(`/qa/questions/${id}`).then((res: any) => setQuestion(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchQuestion(); }, [id]);

  const handleAnswer = async () => {
    if (!answerText.trim()) return;
    try {
      await request.post(`/qa/questions/${id}/answers`, { content: answerText });
      message.success('回答成功'); setAnswerText(''); fetchQuestion();
    } catch (err: any) { message.error(err.message); }
  };

  const handleAccept = async (answerId: number) => {
    try {
      await request.put(`/qa/questions/${id}/answers/${answerId}/accept`);
      message.success('已采纳'); fetchQuestion();
    } catch (err: any) { message.error(err.message); }
  };

  const handleDeleteAnswer = async (answerId: number) => {
    try {
      await request.delete(`/qa/answers/${answerId}`);
      message.success('删除成功'); fetchQuestion();
    } catch (err: any) { message.error(err.message); }
  };

  const handleDeleteQuestion = async () => {
    try {
      await request.delete(`/qa/questions/${id}`);
      message.success('删除成功'); navigate('/qa');
    } catch (err: any) { message.error(err.message); }
  };

  if (loading) return <PostDetailSkeleton />;
  if (!question) return <div style={{ textAlign: 'center', padding: 100 }}>问题不存在</div>;

  const isQuestionAuthor = user?.id === question?.author_id;

  return (
    <div className="page-container" style={{ maxWidth: 800 }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Space><Tag color={question.status === 'resolved' ? 'green' : 'orange'}>{question.status === 'resolved' ? '已解决' : '待解答'}</Tag>
            <Tag>{question.category}</Tag></Space>
          {isQuestionAuthor && (
            <Space size="small">
              <Button size="small" icon={<EditOutlined />} onClick={() => message.info('编辑功能开发中')}>编辑</Button>
              <Popconfirm title="确定删除该问题？" onConfirm={handleDeleteQuestion} okText="删除" cancelText="取消">
                <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
              </Popconfirm>
            </Space>
          )}
        </div>
        <Title level={3}>{question.title}</Title>
        <Space style={{ marginBottom: 16 }}>
          <Avatar src={question.author?.avatar_url} icon={<UserOutlined />} size="small" />
          <Text>{question.author?.nickname}</Text>
          <Text type="secondary">{dayjs(question.created_at).format('YYYY-MM-DD HH:mm')}</Text>
          <Text type="secondary">{question.view_count}浏览 · {question.answer_count}回答</Text>
        </Space>
        <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{question.content}</Paragraph>
      </Card>

      <Card title={`回答 (${question.answer_count})`} style={{ marginTop: 16 }}>
        {isLoggedIn && (
          <div style={{ marginBottom: 16 }}>
            <TextArea rows={3} value={answerText} onChange={e => setAnswerText(e.target.value)} placeholder="写下你的回答..." />
            <Button type="primary" style={{ marginTop: 8 }} onClick={handleAnswer} disabled={!answerText.trim()}>提交回答</Button>
          </div>
        )}
        <List dataSource={question.answers || []} renderItem={(item: any) => (
          <List.Item style={{ background: item.is_accepted ? '#f6ffed' : undefined, padding: 12, borderRadius: 8, marginBottom: 8 }}>
            <List.Item.Meta
              avatar={<Avatar src={item.author?.avatar_url} icon={<UserOutlined />} />}
              title={<Space><Text strong>{item.author?.nickname}</Text>
                {item.is_accepted && <Tag color="green" icon={<CheckCircleOutlined />}>已采纳</Tag>}
                <Text type="secondary">{dayjs(item.created_at).format('MM-DD HH:mm')}</Text></Space>}
              description={item.content}
            />
            {question.author_id === user?.id && !item.is_accepted && (
              <Button size="small" type="link" onClick={() => handleAccept(item.id)}>采纳</Button>
            )}
            {(item.author_id === user?.id || user?.role === 'admin') && (
              <Popconfirm title="确定删除该回答？" onConfirm={() => handleDeleteAnswer(item.id)} okText="删除" cancelText="取消">
                <Button size="small" type="text" danger icon={<DeleteOutlined />}>删除</Button>
              </Popconfirm>
            )}
          </List.Item>
        )} />
      </Card>
    </div>
  );
}
