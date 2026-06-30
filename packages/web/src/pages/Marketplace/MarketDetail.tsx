import { useEffect, useState } from 'react';
import { Card, Typography, Avatar, Tag, Space, Button, message, Spin, Popconfirm, Modal, Form, Input, Select, InputNumber, Row, Col } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { UserOutlined, PhoneOutlined, DeleteOutlined, CheckCircleOutlined, EditOutlined } from '@ant-design/icons';
import request from '../../api/request';
import { useAuthStore } from '../../stores/useAuthStore';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

const conditionLabels: any = { new: '全新', like_new: '几乎全新', good: '良好', fair: '一般', poor: '较差' };
const statusLabels: any = { selling: '在售', reserved: '已预定', sold: '已售出', removed: '已下架' };
const statusColors: any = { selling: 'green', reserved: 'orange', sold: 'red', removed: 'default' };

export default function MarketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm] = Form.useForm();

  const fetchItem = () => {
    request.get(`/marketplace/${id}`).then((res: any) => setItem(res.data)).catch(() => message.error('加载失败')).finally(() => setLoading(false));
  };

  useEffect(() => { fetchItem(); }, [id]);

  const handleDelete = async () => {
    try {
      await request.delete(`/marketplace/${id}`);
      message.success('删除成功');
      navigate('/marketplace');
    } catch (err: any) { message.error(err.message); }
  };

  const handleMarkSold = async () => {
    try {
      await request.put(`/marketplace/${id}/status`, { status: 'sold' });
      message.success('已标记为已售');
      fetchItem();
    } catch (err: any) { message.error(err.message); }
  };

  const handleEdit = () => {
    editForm.setFieldsValue({ title: item.title, description: item.description, price: item.price, originalPrice: item.original_price, conditionLevel: item.condition_level, category: item.category, contactInfo: item.contact_info });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (values: any) => {
    try {
      await request.put(`/marketplace/${id}`, values);
      message.success('更新成功');
      setEditModalOpen(false);
      fetchItem();
    } catch (err: any) { message.error(err.message); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>;
  if (!item) return <div style={{ textAlign: 'center', padding: 100 }}>商品不存在</div>;

  const isOwner = user?.id === item.seller_id;

  return (
    <div className="page-container" style={{ maxWidth: 700 }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Space>
            <Tag color={statusColors[item.status]}>{statusLabels[item.status]}</Tag>
            <Tag>{conditionLabels[item.condition_level]}</Tag>
            <Tag>{item.category}</Tag>
          </Space>
          {isOwner && (
            <Space size="small">
              {item.status === 'selling' && (
                <Button size="small" type="primary" danger icon={<CheckCircleOutlined />} onClick={handleMarkSold}>标记已售</Button>
              )}
              <Button size="small" icon={<EditOutlined />} onClick={handleEdit}>编辑</Button>
              <Popconfirm title="确定删除该商品？" onConfirm={handleDelete} okText="删除" cancelText="取消">
                <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
              </Popconfirm>
            </Space>
          )}
        </div>
        <Title level={3} style={{ margin: '0 0 8px' }}>{item.title}</Title>
        <Space style={{ marginBottom: 16 }} wrap>
          <Avatar src={item.seller?.avatar_url} icon={<UserOutlined />} size="small" />
          <Text>{item.seller?.nickname}</Text>
          <Text type="secondary">{dayjs(item.created_at).format('YYYY-MM-DD HH:mm')}</Text>
        </Space>
        <div style={{ marginBottom: 16 }}>
          <Text type="danger" style={{ fontSize: 24, fontWeight: 'bold' }}>¥{item.price}</Text>
          {item.original_price && <Text delete type="secondary" style={{ marginLeft: 12, fontSize: 16 }}>¥{item.original_price}</Text>}
        </div>
        <Paragraph style={{ fontSize: 15, lineHeight: 1.8 }}>{item.description}</Paragraph>
        {item.images && (() => {
          const images = typeof item.images === 'string' ? JSON.parse(item.images) : item.images;
          return images && images.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>商品图片:</Text>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {images.map((url: string, i: number) => (
                  <img key={i} src={url} alt={`商品图片${i + 1}`} style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 6, border: '1px solid #f0f0f0' }} />
                ))}
              </div>
            </div>
          );
        })()}
        {item.contact_info && (
          <div style={{ padding: '8px 12px', background: '#f6f6f6', borderRadius: 6, marginTop: 12 }}>
            <PhoneOutlined style={{ marginRight: 8, color: '#1677ff' }} />
            <Text>{item.contact_info}</Text>
          </div>
        )}
      </Card>
      <Button style={{ marginTop: 16 }} onClick={() => navigate('/marketplace')}>返回列表</Button>

      <Modal title="编辑商品" open={editModalOpen} onCancel={() => setEditModalOpen(false)} onOk={() => editForm.submit()} width={550}>
        <Form form={editForm} layout="vertical" onFinish={handleEditSubmit}>
          <Form.Item name="title" label="商品名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label="描述" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="price" label="价格" rules={[{ required: true }]}><InputNumber min={0} precision={2} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item name="originalPrice" label="原价"><InputNumber min={0} precision={2} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item name="conditionLevel" label="成色" rules={[{ required: true }]}><Select options={Object.entries(conditionLabels).map(([k, v]) => ({ label: v, value: k }))} /></Form.Item></Col>
          </Row>
          <Form.Item name="category" label="分类" rules={[{ required: true }]}><Select options={[{ label: '教材', value: 'textbook' }, { label: '电子产品', value: 'electronics' }, { label: '生活用品', value: 'daily' }, { label: '其他', value: 'other' }]} /></Form.Item>
          <Form.Item name="contactInfo" label="联系方式" rules={[{ required: true, message: '请填写联系方式' }]}><Input placeholder="手机/微信/QQ" /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
