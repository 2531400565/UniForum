import { useEffect, useState } from 'react';
import { List, Typography, Tag, Pagination, Card, Button, Space, Modal, Form, Input, Select, message } from 'antd';
import { QuestionCircleOutlined, PlusOutlined, CheckCircleOutlined } from '@ant-design/icons';
import request from '../../api/request';
import { useAuthStore } from '../../stores/useAuthStore';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { ListSkeleton } from '../../components/Skeleton';

const categoryLabels: any = { course: '选课', internship: '实习', career: '就业', academic: '学术', other: '其他' };

export default function QuestionList() {
  const navigate = useNavigate();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchData = () => {
    setLoading(true);
    request.get('/qa/questions', { params: { page, pageSize: 15 } }).then((res: any) => {
      setData(res.data?.list || []); setTotal(res.data?.total || 0);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [page]);

  const handleCreate = async (values: any) => {
    try {
      await request.post('/qa/questions', values);
      message.success('提问成功'); setModalOpen(false); form.resetFields(); fetchData();
    } catch (err: any) { message.error(err.message); }
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={3}><QuestionCircleOutlined /> 问答社区</Typography.Title>
        {isLoggedIn && <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>提问</Button>}
      </div>
      {loading ? <ListSkeleton rows={6} /> : (
        <List dataSource={data} renderItem={(item: any) => (
          <Card style={{ marginBottom: 12, cursor: 'pointer' }} hoverable onClick={() => navigate(`/qa/${item.id}`)}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Space>{item.status === 'resolved' ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <QuestionCircleOutlined style={{ color: '#faad14' }} />}
                <Typography.Text strong>{item.title}</Typography.Text></Space>
              <Space><Tag>{categoryLabels[item.category]}</Tag>
                <Typography.Text type="secondary">{item.answer_count}回答 · {item.view_count}浏览</Typography.Text>
                <Typography.Text type="secondary">{item.author?.nickname} · {dayjs(item.created_at).format('MM-DD')}</Typography.Text></Space>
            </div>
          </Card>
        )} />
      )}
      <div style={{ textAlign: 'center', marginTop: 16 }}><Pagination current={page} total={total} pageSize={15} onChange={setPage} /></div>

      <Modal title="提出问题" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()} width={550}>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="title" label="标题" rules={[{ required: true }]}><Input placeholder="简要描述你的问题" /></Form.Item>
          <Form.Item name="category" label="分类" rules={[{ required: true }]}><Select options={Object.entries(categoryLabels).map(([k, v]) => ({ label: v, value: k }))} /></Form.Item>
          <Form.Item name="content" label="详细描述" rules={[{ required: true }]}><Input.TextArea rows={5} placeholder="详细描述你的问题..." /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
