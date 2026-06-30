import { useEffect, useState } from 'react';
import { List, Typography, Tag, Pagination, Card, Button, Tabs, Space, Modal, Form, Input, Select, message, Popconfirm } from 'antd';
import { HeartOutlined, PlusOutlined, EnvironmentOutlined, PhoneOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import request from '../../api/request';
import { useAuthStore } from '../../stores/useAuthStore';
import dayjs from 'dayjs';
import { ListSkeleton } from '../../components/Skeleton';

const statusConfig: any = {
  open: { label: '进行中', color: 'blue' },
  resolved: { label: '已解决', color: 'green' },
  closed: { label: '已关闭', color: 'default' },
};

export default function LostFoundList() {
  const { isLoggedIn, user } = useAuthStore();
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [type, setType] = useState('');
  const [status, setStatus] = useState('open');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const fetchData = () => {
    setLoading(true);
    request.get('/lost-found', { params: { page, pageSize: 15, type: type || undefined, status } }).then((res: any) => {
      setData(res.data?.list || []); setTotal(res.data?.total || 0);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [page, type, status]);

  const handleCreate = async (values: any) => {
    try {
      await request.post('/lost-found', values);
      message.success('发布成功'); setModalOpen(false); form.resetFields(); fetchData();
    } catch (err: any) { message.error(err.message); }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await request.put(`/lost-found/${id}/status`, { status: newStatus });
      message.success('状态更新成功');
      fetchData();
    } catch (err: any) { message.error(err.message); }
  };

  const handleEdit = (item: any) => {
    setEditItem(item);
    editForm.setFieldsValue({ title: item.title, description: item.description, location: item.location, contactInfo: item.contact_info });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (values: any) => {
    try {
      await request.put(`/lost-found/${editItem.id}`, values);
      message.success('更新成功'); setEditModalOpen(false); fetchData();
    } catch (err: any) { message.error(err.message); }
  };

  const handleDelete = async (id: number) => {
    try {
      await request.delete(`/lost-found/${id}`);
      message.success('删除成功'); fetchData();
    } catch (err: any) { message.error(err.message); }
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={3}><HeartOutlined /> 失物招领</Typography.Title>
        {isLoggedIn && <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>发布</Button>}
      </div>
      <Space style={{ marginBottom: 16 }}>
        <Tabs activeKey={type} onChange={(k) => { setType(k); setPage(1); }} items={[
          { key: '', label: '全部' }, { key: 'lost', label: '寻物启事' }, { key: 'found', label: '拾到物品' },
        ]} />
      </Space>
      <Tabs activeKey={status} onChange={(k) => { setStatus(k); setPage(1); }} items={[
        { key: 'open', label: '进行中' }, { key: 'resolved', label: '已解决' }, { key: 'closed', label: '已关闭' }, { key: 'all', label: '全部' },
      ]} style={{ marginBottom: 16 }} />
      {loading ? <ListSkeleton rows={6} /> : (
        <List dataSource={data} renderItem={(item: any) => (
          <Card style={{ marginBottom: 12 }} hoverable>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Space wrap>
                <Tag color={item.type === 'lost' ? 'red' : 'green'}>{item.type === 'lost' ? '寻物' : '拾到'}</Tag>
                <Tag color={statusConfig[item.status]?.color || 'default'}>{statusConfig[item.status]?.label || item.status}</Tag>
                <Typography.Text strong style={{ fontSize: 16 }}>{item.title}</Typography.Text>
              </Space>
              <Space>
                <Typography.Text type="secondary">{item.item_category}</Typography.Text>
                <Typography.Text type="secondary">{dayjs(item.created_at).format('MM-DD HH:mm')}</Typography.Text>
              </Space>
            </div>
            <Typography.Paragraph ellipsis={{ rows: 2 }} type="secondary" style={{ marginTop: 8 }}>{item.description}</Typography.Paragraph>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <Space size="large">
                {item.location && <Typography.Text type="secondary"><EnvironmentOutlined /> {item.location}</Typography.Text>}
                {item.contact_info && <Typography.Text type="secondary"><PhoneOutlined /> {item.contact_info}</Typography.Text>}
                <Typography.Text type="secondary">发布者: {item.author?.nickname}</Typography.Text>
              </Space>
              {isLoggedIn && item.author_id === user?.id && (
                <Space size="small">
                  {item.status === 'open' && (
                    <Button type="primary" size="small" onClick={() => handleStatusChange(item.id, 'resolved')}>
                      {item.type === 'lost' ? '标记为已找到' : '标记为已归还'}
                    </Button>
                  )}
                  <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(item)}>编辑</Button>
                  <Popconfirm title="确定删除该记录？" onConfirm={() => handleDelete(item.id)} okText="删除" cancelText="取消">
                    <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
                  </Popconfirm>
                </Space>
              )}
            </div>
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
      <Modal title="编辑失物招领" open={editModalOpen} onCancel={() => setEditModalOpen(false)} onOk={() => editForm.submit()} width={500}>
        <Form form={editForm} layout="vertical" onFinish={handleEditSubmit}>
          <Form.Item name="title" label="标题" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label="描述" rules={[{ required: true }]}><Input.TextArea rows={4} /></Form.Item>
          <Form.Item name="location" label="地点"><Input /></Form.Item>
          <Form.Item name="contactInfo" label="联系方式"><Input /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
