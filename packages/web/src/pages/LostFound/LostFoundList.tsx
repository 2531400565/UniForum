import { useEffect, useState } from 'react';
import { List, Typography, Tag, Pagination, Spin, Card, Button, Tabs, Space, Modal, Form, Input, Select, message } from 'antd';
import { HeartOutlined, PlusOutlined } from '@ant-design/icons';
import request from '../../api/request';
import { useAuthStore } from '../../stores/useAuthStore';
import dayjs from 'dayjs';

export default function LostFoundList() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchData = () => {
    setLoading(true);
    request.get('/lost-found', { params: { page, pageSize: 15, type: type || undefined } }).then((res: any) => {
      setData(res.data?.list || []); setTotal(res.data?.total || 0);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [page, type]);

  const handleCreate = async (values: any) => {
    try {
      await request.post('/lost-found', values);
      message.success('发布成功'); setModalOpen(false); form.resetFields(); fetchData();
    } catch (err: any) { message.error(err.message); }
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={3}><HeartOutlined /> 失物招领</Typography.Title>
        {isLoggedIn && <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>发布</Button>}
      </div>
      <Tabs activeKey={type} onChange={(k) => { setType(k); setPage(1); }} items={[
        { key: '', label: '全部' }, { key: 'lost', label: '寻物启事' }, { key: 'found', label: '拾到物品' },
      ]} />
      {loading ? <div style={{ textAlign: 'center', padding: 50 }}><Spin /></div> : (
        <List dataSource={data} renderItem={(item: any) => (
          <Card style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Space><Tag color={item.type === 'lost' ? 'red' : 'green'}>{item.type === 'lost' ? '寻物' : '拾到'}</Tag>
                <Typography.Text strong>{item.title}</Typography.Text></Space>
              <Space><Typography.Text type="secondary">{item.item_category}</Typography.Text>
                <Typography.Text type="secondary">{dayjs(item.created_at).format('MM-DD')}</Typography.Text></Space>
            </div>
            <Typography.Paragraph ellipsis type="secondary" style={{ marginTop: 8 }}>{item.description}</Typography.Paragraph>
          </Card>
        )} />
      )}
      <div style={{ textAlign: 'center', marginTop: 16 }}><Pagination current={page} total={total} pageSize={15} onChange={setPage} /></div>

      <Modal title="发布失物招领" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()} width={500}>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="title" label="标题" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="type" label="类型" rules={[{ required: true }]}><Select options={[{ label: '寻物启事', value: 'lost' }, { label: '拾到物品', value: 'found' }]} /></Form.Item>
          <Form.Item name="itemCategory" label="物品类别" rules={[{ required: true }]}><Select options={[{ label: '证件', value: 'certificate' }, { label: '电子产品', value: 'electronics' }, { label: '日用品', value: 'daily' }, { label: '其他', value: 'other' }]} /></Form.Item>
          <Form.Item name="description" label="描述" rules={[{ required: true }]}><Input.TextArea rows={4} /></Form.Item>
          <Form.Item name="location" label="地点"><Input /></Form.Item>
          <Form.Item name="contactInfo" label="联系方式"><Input /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
