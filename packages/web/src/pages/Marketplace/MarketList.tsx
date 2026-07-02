import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Tag, Pagination, Card, Button, Space, Modal, Form, Input, Select, InputNumber, message, Row, Col, Empty, Tooltip, Popconfirm, Upload } from 'antd';
import { ShopOutlined, PlusOutlined, PhoneOutlined, CheckCircleOutlined, EditOutlined, DeleteOutlined, UploadOutlined, PictureOutlined } from '@ant-design/icons';
import request from '../../api/request';
import { useAuthStore } from '../../stores/useAuthStore';
import dayjs from 'dayjs';
import { ListSkeleton } from '../../components/Skeleton';

const conditionLabels: any = { new: '全新', like_new: '几乎全新', good: '良好', fair: '一般', poor: '较差' };
const categoryLabels: any = { textbook: '教材', electronics: '电子产品', daily: '生活用品', other: '其他' };
const sortOptions = [
  { label: '最新发布', value: 'newest' },
  { label: '价格最低', value: 'price_asc' },
  { label: '价格最高', value: 'price_desc' },
];

export default function MarketList() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('newest');
  const [hideSold, setHideSold] = useState(true);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);
  const [editFileList, setEditFileList] = useState<any[]>([]);

  const fetchData = () => {
    setLoading(true);
    request.get('/marketplace', { params: { page, pageSize: 12, status: hideSold ? 'selling' : 'all', category: category || undefined, sort } }).then((res: any) => {
      setData(res.data?.list || []); setTotal(res.data?.total || 0);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [page, category, sort, hideSold]);

  const handleCreate = async (values: any) => {
    try {
      // 先上传图片
      const imageUrls: string[] = [];
      for (const file of fileList) {
        if (file.originFileObj) {
          const formData = new FormData();
          formData.append('image', file.originFileObj);
          const resp: any = await request.post('/upload/image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
          if (resp.data?.url) imageUrls.push(resp.data.url);
        } else if (file.url) {
          imageUrls.push(file.url);
        }
      }
      await request.post('/marketplace', { ...values, images: imageUrls.length > 0 ? imageUrls : null });
      message.success('发布成功'); setModalOpen(false); form.resetFields(); setFileList([]); fetchData();
    } catch (err: any) { message.error(err.message); }
  };

  const handleMarkSold = async (id: number) => {
    try {
      await request.put(`/marketplace/${id}/status`, { status: 'sold' });
      message.success('已标记为已售'); fetchData();
    } catch (err: any) { message.error(err.message); }
  };

  const handleEdit = (item: any) => {
    setEditItem(item);
    editForm.setFieldsValue({ title: item.title, description: item.description, price: item.price, originalPrice: item.original_price, conditionLevel: item.condition_level, category: item.category, contactInfo: item.contact_info });
    // 设置已有图片
    const images = item.images ? (typeof item.images === 'string' ? JSON.parse(item.images) : item.images) : [];
    setEditFileList(images.map((url: string, i: number) => ({ uid: `-${i}`, name: `image-${i}`, status: 'done', url })));
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (values: any) => {
    try {
      // 先上传新图片
      const imageUrls: string[] = [];
      for (const file of editFileList) {
        if (file.originFileObj) {
          const formData = new FormData();
          formData.append('image', file.originFileObj);
          const resp: any = await request.post('/upload/image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
          if (resp.data?.url) imageUrls.push(resp.data.url);
        } else if (file.url) {
          imageUrls.push(file.url);
        }
      }
      await request.put(`/marketplace/${editItem.id}`, { ...values, images: imageUrls.length > 0 ? imageUrls : null });
      message.success('更新成功'); setEditModalOpen(false); setEditFileList([]); fetchData();
    } catch (err: any) { message.error(err.message); }
  };

  const handleDelete = async (id: number) => {
    try {
      await request.delete(`/marketplace/${id}`);
      message.success('删除成功'); fetchData();
    } catch (err: any) { message.error(err.message); }
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={3}><ShopOutlined /> 二手市场</Typography.Title>
        {isLoggedIn && <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>发布商品</Button>}
      </div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Space>
          <Typography.Text>分类:</Typography.Text>
          {['', 'textbook', 'electronics', 'daily', 'other'].map(k => (
            <Tag.CheckableTag key={k} checked={category === k} onChange={() => { setCategory(k); setPage(1); }}>{k ? categoryLabels[k] : '全部'}</Tag.CheckableTag>
          ))}
        </Space>
        <Space>
          <Typography.Text>排序:</Typography.Text>
          <Select value={sort} onChange={setSort} options={sortOptions} style={{ width: 120 }} size="small" />
        </Space>
        <Tag.CheckableTag checked={!hideSold} onChange={() => { setHideSold(!hideSold); setPage(1); }}>显示已售</Tag.CheckableTag>
      </Space>
      {loading ? <ListSkeleton rows={4} /> : data.length === 0 ? <Empty description="暂无商品" /> : (
        <Row gutter={[16, 16]}>
          {data.map((item: any) => {
            const isSold = item.status === 'sold';
            const isOwner = user?.id === item.seller_id;
            const itemImages = item.images ? (typeof item.images === 'string' ? JSON.parse(item.images) : item.images) : [];
            return (
              <Col span={6} key={item.id}>
                <Card
                  hoverable
                  style={{
                    opacity: isSold ? 0.6 : 1,
                    filter: isSold ? 'grayscale(80%)' : 'none',
                    position: 'relative',
                    cursor: 'pointer',
                  }}
                  onClick={() => navigate(`/marketplace/${item.id}`)}
                >
                  {isSold && (
                    <div style={{
                      position: 'absolute', top: 8, right: 8, zIndex: 1,
                      background: '#ff4d4f', color: '#fff', padding: '2px 8px',
                      borderRadius: 4, fontSize: 12, fontWeight: 'bold',
                    }}>已售出</div>
                  )}
                  <div style={{ marginBottom: 8 }}>
                    {itemImages.length > 0 ? (
                      <img src={itemImages[0]} alt={item.title} style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 6 }} />
                    ) : (
                      <div style={{ width: '100%', height: 140, background: '#f5f5f5', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: 13 }}>
                        <PictureOutlined style={{ marginRight: 4 }} />用户暂未上传图片
                      </div>
                    )}
                  </div>
                  <Card.Meta
                    title={item.title}
                    description={
                      <>
                        <Typography.Text type="danger" style={{ fontSize: 18 }}>¥{item.price}</Typography.Text>
                        {item.original_price && <Typography.Text delete type="secondary" style={{ marginLeft: 8 }}>¥{item.original_price}</Typography.Text>}
                        <div style={{ marginTop: 8 }}>
                          <Tag>{conditionLabels[item.condition_level]}</Tag>
                          <Tag>{item.category}</Tag>
                        </div>
                        <Typography.Paragraph ellipsis type="secondary" style={{ marginTop: 4 }}>{item.description}</Typography.Paragraph>

                        {/* 联系方式 */}
                        {item.contact_info && (
                          <div style={{ marginTop: 4, padding: '4px 8px', background: '#f6f6f6', borderRadius: 4 }}>
                            <PhoneOutlined style={{ marginRight: 4, color: '#1677ff' }} />
                            <Typography.Text style={{ fontSize: 12 }}>{item.contact_info}</Typography.Text>
                          </div>
                        )}

                        <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
                          {item.seller?.nickname} · {dayjs(item.created_at).format('MM-DD')}
                        </Typography.Text>
                        {isOwner && !isSold && (
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                            <Space size="small">
                              <Tooltip title="标记为已售出">
                                <Button size="small" type="link" danger onClick={() => handleMarkSold(item.id)}>
                                  <CheckCircleOutlined /> 标记已售
                                </Button>
                              </Tooltip>
                              <Button size="small" type="text" icon={<EditOutlined />} onClick={() => handleEdit(item)}>编辑</Button>
                              <Popconfirm title="确定删除该商品？" onConfirm={() => handleDelete(item.id)} okText="删除" cancelText="取消">
                                <Button size="small" type="text" danger icon={<DeleteOutlined />}>删除</Button>
                              </Popconfirm>
                            </Space>
                          </div>
                        )}
                      </>
                    }
                  />
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
      <div style={{ textAlign: 'center', marginTop: 16 }}><Pagination current={page} total={total} pageSize={12} onChange={setPage} showSizeChanger={false} showTotal={(t) => `共 ${t} 件商品`} /></div>

      <Modal title="发布商品" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()} width={550}>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="title" label="商品名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label="描述" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="price" label="价格" rules={[{ required: true }]}><InputNumber min={0} precision={2} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item name="originalPrice" label="原价"><InputNumber min={0} precision={2} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item name="conditionLevel" label="成色" rules={[{ required: true }]}><Select options={Object.entries(conditionLabels).map(([k, v]) => ({ label: v, value: k }))} /></Form.Item></Col>
          </Row>
          <Form.Item name="category" label="分类" rules={[{ required: true }]}><Select options={[{ label: '教材', value: 'textbook' }, { label: '电子产品', value: 'electronics' }, { label: '生活用品', value: 'daily' }, { label: '其他', value: 'other' }]} /></Form.Item>
          <Form.Item name="contactInfo" label="联系方式" rules={[{ required: true, message: '请填写联系方式' }]}><Input placeholder="手机/微信/QQ" /></Form.Item>
          <Form.Item label="商品图片"><Upload beforeUpload={() => false} fileList={fileList} onChange={({ fileList }) => setFileList(fileList)} listType="picture-card" maxCount={5}><div><UploadOutlined /><div style={{ marginTop: 8 }}>上传图片</div></div></Upload></Form.Item>
        </Form>
      </Modal>
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
          <Form.Item label="商品图片"><Upload beforeUpload={() => false} fileList={editFileList} onChange={({ fileList }) => setEditFileList(fileList)} listType="picture-card" maxCount={5}><div><UploadOutlined /><div style={{ marginTop: 8 }}>上传图片</div></div></Upload></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
