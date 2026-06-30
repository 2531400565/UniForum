import { useEffect, useState } from 'react';
import { Card, Typography, Avatar, Tag, Space, Button, message, Spin, Popconfirm, Modal, Form, Input, Select } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { UserOutlined, EnvironmentOutlined, PhoneOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import request from '../../api/request';
import { useAuthStore } from '../../stores/useAuthStore';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

const statusConfig: any = {
  open: { label: '进行中', color: 'blue' },
  resolved: { label: '已解决', color: 'green' },
  closed: { label: '已关闭', color: 'default' },
};

export default function LostFoundDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuthStore();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm] = Form.useForm();

  const fetchItem = () => {
    request.get(`/lost-found/${id}`).then((res: any) => setItem(res.data)).catch(() => message.error('加载失败')).finally(() => setLoading(false));
  };

  useEffect(() => { fetchItem(); }, [id]);

  const handleDelete = async () => {
    try {
      await request.delete(`/lost-found/${id}`);
      message.success('删除成功');
      navigate('/lost-found');
    } catch (err: any) { message.error(err.message); }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await request.put(`/lost-found/${id}/status`, { status: newStatus });
      message.success('状态更新成功');
      fetchItem();
    } catch (err: any) { message.error(err.message); }
  };

  const handleEdit = () => {
    editForm.setFieldsValue({ title: item.title, description: item.description, location: item.location, contactInfo: item.contact_info });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (values: any) => {
    try {
      await request.put(`/lost-found/${id}`, values);
      message.success('更新成功');
      setEditModalOpen(false);
      fetchItem();
    } catch (err: any) { message.error(err.message); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>;
  if (!item) return <div style={{ textAlign: 'center', padding: 100 }}>记录不存在</div>;

  const isOwner = user?.id === item.author_id;

  return (
    <div className="page-container" style={{ maxWidth: 700 }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Space>
            <Tag color={item.type === 'lost' ? 'red' : 'green'}>{item.type === 'lost' ? '寻物启事' : '拾到物品'}</Tag>
            <Tag color={statusConfig[item.status]?.color}>{statusConfig[item.status]?.label}</Tag>
            <Tag>{item.item_category}</Tag>
          </Space>
          {isOwner && (
            <Space size="small">
              {item.status === 'open' && (
                <Button size="small" type="primary" onClick={() => handleStatusChange(item.status === 'open' ? 'resolved' : 'open')}>
                  {item.type === 'lost' ? '标记为已找到' : '标记为已归还'}
                </Button>
              )}
              <Button size="small" icon={<EditOutlined />} onClick={handleEdit}>编辑</Button>
              <Popconfirm title="确定删除该记录？" onConfirm={handleDelete} okText="删除" cancelText="取消">
                <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
              </Popconfirm>
            </Space>
          )}
        </div>
        <Title level={3} style={{ margin: '0 0 12px' }}>{item.title}</Title>
        <Space style={{ marginBottom: 16 }} wrap>
          <Avatar src={item.author?.avatar_url} icon={<UserOutlined />} size="small" />
          <Text>{item.author?.nickname}</Text>
          <Text type="secondary">{dayjs(item.created_at).format('YYYY-MM-DD HH:mm')}</Text>
        </Space>
        <Paragraph style={{ fontSize: 15, lineHeight: 1.8 }}>{item.description}</Paragraph>
        {item.images && (() => {
          const images = typeof item.images === 'string' ? JSON.parse(item.images) : item.images;
          return images && images.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>图片:</Text>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {images.map((url: string, i: number) => (
                  <img key={i} src={url} alt={`图片${i + 1}`} style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 6, border: '1px solid #f0f0f0' }} />
                ))}
              </div>
            </div>
          );
        })()}
        <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
          {item.location && <Text><EnvironmentOutlined /> {item.location}</Text>}
          {item.contact_info && <Text><PhoneOutlined /> {item.contact_info}</Text>}
        </div>
      </Card>
      <Button style={{ marginTop: 16 }} onClick={() => navigate('/lost-found')}>返回列表</Button>

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
