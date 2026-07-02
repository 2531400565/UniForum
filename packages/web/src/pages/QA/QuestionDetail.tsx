import { useEffect, useState } from 'react';
import { Card, Typography, Avatar, Button, Space, Input, List, message, Tag, Divider, Popconfirm, Modal, Form, Select } from 'antd';
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
  const [editOpen, setEditOpen] = useState(false);
  const [editForm] = Form.useForm();

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

  const handleEditOpen = () => {
    editForm.setFieldsValue({ title: question.title, category: question.category, content: question.content });
    setEditOpen(true);
  };

  const handleEditSubmit = async (values: any) => {
    try {
      await request.put(`/qa/questions/${id}`, values);
      message.success('更新成功'); setEditOpen(false); fetchQuestion();
    } catch (err: any) { message.error(err.message); }
  };

  // Ctrl+Enter 快捷回答
  const handleAnswerKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'Enter' && answerText.trim()) {
      handleAnswer();
    }
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
              <Button size="small" icon={<EditOutlined />} onClick={handleEditOpen}>编辑</Button>
              <Popconfirm title="确定删除该问题？" onConfirm={handleDeleteQuestion} okText="删除" cancelText="取消">
                <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
              </Popconfirm>
            </Space>
          )}
        </div>
        <Title level={3}>{question.title}</Title>
        <Space style={{ marginBottom: 16 }} wrap>
          <Avatar src={question.author?.avatar_url} icon={<UserOutlined />} size="small" />
          <Text>{question.author?.nickname}</Text>
          <Text type="secondary">{dayjs(question.created_at).format('YYYY-MM-DD HH:mm')}</Text>
          <Text type="secondary">{question.view_count}浏览 · {question.answer_count}回答</Text>
        </Space>
        {question.tags && (() => {
          const tags = Array.isArray(question.tags) ? question.tags : JSON.parse(question.tags);
          return tags && tags.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              {tags.map((tag: string, i: number) => <Tag key={i} color="blue">{tag}</Tag>)}
            </div>
          );
        })()}
        <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{question.content}</Paragraph>
      </Card>

      <Card title={`回答 (${question.answer_count})`} style={{ marginTop: 16 }}>
        {isLoggedIn && (
          <div style={{ marginBottom: 16 }}>
            <TextArea rows={3} value={answerText} onChange={e => setAnswerText(e.target.value)} onKeyDown={handleAnswerKeyDown} placeholder="写下你的回答... (Ctrl+Enter 提交)" />
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
      <Modal title="编辑问题" open={editOpen} onCancel={() => setEditOpen(false)} onOk={() => editForm.submit()} width={550}>
        <Form form={editForm} layout="vertical" onFinish={handleEditSubmit}>
          <Form.Item name="title" label="标题" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="category" label="分类" rules={[{ required: true }]}><Select options={[
            { label: '选课', value: 'course' }, { label: '实习', value: 'internship' }, { label: '就业', value: 'career' }, { label: '学术', value: 'academic' }, { label: '其他', value: 'other' },
          ]} /></Form.Item>
          <Form.Item name="content" label="详细描述" rules={[{ required: true }]}><Input.TextArea rows={5} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
