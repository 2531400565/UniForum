import { useEffect, useState } from 'react';
import { Typography, Tag, Pagination, Spin, Card, Button, Space, Modal, Form, Input, Select, InputNumber, message, Row, Col, Empty, Tooltip } from 'antd';
import { ShopOutlined, PlusOutlined, PhoneOutlined, CheckCircleOutlined } from '@ant-design/icons';
import request from '../../api/request';
import { useAuthStore } from '../../stores/useAuthStore';
import dayjs from 'dayjs';

const conditionLabels: any = { new: '全新', like_new: '几乎全新', good: '良好', fair: '一般', poor: '较差' };

export default function MarketList() {
  const user = useAuthStore((s) => s.user);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchData = () => {
    setLoading(true);
    request.get('/marketplace', { params: { page, pageSize: 12, status: 'all' } }).then((res: any) => {
      setData(res.data?.list || []); setTotal(res.data?.total || 0);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [page]);

  const handleCreate = async (values: any) => {
    try {
      await request.post('/marketplace', values);
      message.success('发布成功'); setModalOpen(false); form.resetFields(); fetchData();
    } catch (err: any) { message.error(err.message); }
  };

  const handleMarkSold = async (id: number) => {
    try {
      await request.put(`/marketplace/${id}/status`, { status: 'sold' });
      message.success('已标记为已售'); fetchData();
    } catch (err: any) { message.error(err.message); }
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={3}><ShopOutlined /> 二手市场</Typography.Title>
        {isLoggedIn && <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>发布商品</Button>}
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 50 }}><Spin /></div> : data.length === 0 ? <Empty description="暂无商品" /> : (
        <Row gutter={[16, 16]}>
          {data.map((item: any) => {
            const isSold = item.status === 'sold';
            const isOwner = user?.id === item.seller_id;
            return (
              <Col span={6} key={item.id}>
                <Card
                  hoverable
                  style={{
                    opacity: isSold ? 0.6 : 1,
                    filter: isSold ? 'grayscale(80%)' : 'none',
                    position: 'relative',
                  }}
                >
                  {isSold && (
                    <div style={{
                      position: 'absolute', top: 8, right: 8, zIndex: 1,
                      background: '#ff4d4f', color: '#fff', padding: '2px 8px',
                      borderRadius: 4, fontSize: 12, fontWeight: 'bold',
                    }}>已售出</div>
                  )}
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

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            {item.seller?.nickname} · {dayjs(item.created_at).format('MM-DD')}
                          </Typography.Text>
                          {isOwner && !isSold && (
                            <Tooltip title="标记为已售出">
                              <Button size="small" type="link" danger onClick={() => handleMarkSold(item.id)}>
                                <CheckCircleOutlined /> 标记已售
                              </Button>
                            </Tooltip>
                          )}
                        </div>
                      </>
                    }
                  />
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
      <div style={{ textAlign: 'center', marginTop: 16 }}><Pagination current={page} total={total} pageSize={12} onChange={setPage} /></div>

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
        </Form>
      </Modal>
    </div>
  );
}
