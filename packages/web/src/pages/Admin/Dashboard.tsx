import { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Table, Tag, Button, Space, message, Modal, Form, Input, Select, Tabs, Tooltip } from 'antd';
import { UserOutlined, MessageOutlined, FileTextOutlined, NotificationOutlined, PlusOutlined } from '@ant-design/icons';
import request from '../../api/request';
import { useAuthStore } from '../../stores/useAuthStore';

const announcementTypeOptions = [
  { label: '学校通知', value: 'notice' },
  { label: '学术讲座', value: 'lecture' },
  { label: '社团活动', value: 'club' },
  { label: '其他', value: 'other' },
];
const typeLabels: any = { notice: '学校通知', lecture: '学术讲座', club: '社团活动', other: '其他' };
const typeColors: any = { notice: 'red', lecture: 'blue', club: 'green', other: 'default' };

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ users: 0, posts: 0, resources: 0, announcements: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [announcementModal, setAnnouncementModal] = useState(false);
  const [annForm] = Form.useForm();

  const fetchAll = () => {
    request.get('/posts', { params: { pageSize: 1 } }).then((res: any) => setStats(s => ({ ...s, posts: res.data?.total || 0 }))).catch(() => {});
    request.get('/users', { params: { pageSize: 1 } }).then((res: any) => setStats(s => ({ ...s, users: res.data?.total || 0 }))).catch(() => {});
    request.get('/resources', { params: { pageSize: 1, status: 'pending' } }).then((res: any) => setStats(s => ({ ...s, resources: res.data?.total || 0 }))).catch(() => {});
    request.get('/announcements', { params: { pageSize: 1 } }).then((res: any) => setStats(s => ({ ...s, announcements: res.data?.total || 0 }))).catch(() => {});
    request.get('/users', { params: { pageSize: 50 } }).then((res: any) => setUsers(res.data?.list || [])).catch(() => {});
    request.get('/resources', { params: { pageSize: 50, status: 'pending' } }).then((res: any) => setResources(res.data?.list || [])).catch(() => {});
    request.get('/announcements', { params: { pageSize: 50, showAll: 'true' } }).then((res: any) => setAnnouncements(res.data?.list || [])).catch(() => {});
  };

  useEffect(() => { fetchAll(); }, []);

  const handleUserStatus = async (userId: number, status: string) => {
    try {
      await request.put(`/users/${userId}/status`, { status });
      message.success('操作成功');
      request.get('/users', { params: { pageSize: 50 } }).then((res: any) => setUsers(res.data?.list || []));
    } catch (err: any) { message.error(err.message); }
  };

  const handleResourceStatus = async (resourceId: number, status: string) => {
    try {
      await request.put(`/resources/${resourceId}/status`, { status });
      message.success('操作成功');
      request.get('/resources', { params: { pageSize: 50, status: 'pending' } }).then((res: any) => setResources(res.data?.list || []));
    } catch (err: any) { message.error(err.message); }
  };

  const handleCreateAnnouncement = async (values: any) => {
    try {
      await request.post('/announcements', { ...values, priority: Number(values.priority) || 0 });
      message.success('公告发布成功');
      setAnnouncementModal(false);
      annForm.resetFields();
      request.get('/announcements', { params: { pageSize: 50, showAll: 'true' } }).then((res: any) => setAnnouncements(res.data?.list || []));
    } catch (err: any) { message.error(err.message); }
  };

  const handleDeleteAnnouncement = async (id: number) => {
    try {
      await request.delete(`/announcements/${id}`);
      message.success('公告已删除');
      request.get('/announcements', { params: { pageSize: 50, showAll: 'true' } }).then((res: any) => setAnnouncements(res.data?.list || []));
    } catch (err: any) { message.error(err.message); }
  };

  const userColumns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '昵称', dataIndex: 'nickname' },
    { title: '邮箱', dataIndex: 'email' },
    { title: '院系', dataIndex: 'department' },
    { title: '角色', dataIndex: 'role', render: (r: string) => <Tag color={r === 'admin' ? 'red' : r === 'moderator' ? 'blue' : 'default'}>{r}</Tag> },
    { title: '状态', dataIndex: 'status', render: (s: string) => <Tag color={s === 'active' ? 'green' : 'red'}>{s}</Tag> },
    { title: '操作', render: (_: any, record: any) => {
      const isSelf = record.id === user?.id;
      const isAdmin = record.role === 'admin';
      const canBan = !isSelf && !isAdmin;
      const tooltipText = isSelf ? '不能封禁自己' : isAdmin ? '不能封禁管理员' : '';
      return (
        <Space>
          {record.status === 'active' ? (
            <Tooltip title={tooltipText}><Button size="small" danger disabled={!canBan} onClick={() => handleUserStatus(record.id, 'banned')}>封禁</Button></Tooltip>
          ) : (
            <Button size="small" type="primary" onClick={() => handleUserStatus(record.id, 'active')}>解封</Button>
          )}
        </Space>
      );
    }},
  ];

  const resourceColumns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '名称', dataIndex: 'title' },
    { title: '类型', dataIndex: 'file_type' },
    { title: '上传者', render: (_: any, r: any) => r.uploader?.nickname },
    { title: '操作', render: (_: any, record: any) => (
      <Space><Button size="small" type="primary" onClick={() => handleResourceStatus(record.id, 'active')}>通过</Button>
        <Button size="small" danger onClick={() => handleResourceStatus(record.id, 'rejected')}>拒绝</Button></Space>
    )},
  ];

  const announcementColumns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '标题', dataIndex: 'title' },
    { title: '类型', dataIndex: 'type', render: (t: string) => <Tag color={typeColors[t]}>{typeLabels[t]}</Tag> },
    { title: '发布者', render: (_: any, a: any) => a.publisher?.nickname },
    { title: '状态', dataIndex: 'status', render: (s: string) => <Tag color={s === 'active' ? 'green' : 'default'}>{s === 'active' ? '生效中' : '已删除'}</Tag> },
    { title: '操作', render: (_: any, record: any) => (
      <Button size="small" danger onClick={() => handleDeleteAnnouncement(record.id)}>删除</Button>
    )},
  ];

  return (
    <div className="page-container">
      <Typography.Title level={3}>管理后台</Typography.Title>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}><Card><Typography.Text><UserOutlined /> 用户数</Typography.Text><Typography.Title level={2}>{stats.users}</Typography.Title></Card></Col>
        <Col span={6}><Card><Typography.Text><MessageOutlined /> 帖子数</Typography.Text><Typography.Title level={2}>{stats.posts}</Typography.Title></Card></Col>
        <Col span={6}><Card><Typography.Text><FileTextOutlined /> 待审资源</Typography.Text><Typography.Title level={2}>{stats.resources}</Typography.Title></Card></Col>
        <Col span={6}><Card><Typography.Text><NotificationOutlined /> 公告数</Typography.Text><Typography.Title level={2}>{stats.announcements}</Typography.Title></Card></Col>
      </Row>

      <Tabs items={[
        {
          key: 'users',
          label: '用户管理',
          children: (
            <Card>
              <Table dataSource={users} columns={userColumns} rowKey="id" size="small" pagination={{ pageSize: 10 }} />
            </Card>
          ),
        },
        {
          key: 'resources',
          label: `资源审核 (${resources.length})`,
          children: (
            <Card>
              <Table dataSource={resources} columns={resourceColumns} rowKey="id" size="small" pagination={{ pageSize: 10 }} />
            </Card>
          ),
        },
        {
          key: 'announcements',
          label: '公告管理',
          children: (
            <Card extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setAnnouncementModal(true)}>发布公告</Button>}>
              <Table dataSource={announcements} columns={announcementColumns} rowKey="id" size="small" pagination={{ pageSize: 10 }} />
            </Card>
          ),
        },
      ]} />

      {/* 发布公告弹窗 */}
      <Modal title="发布校园公告" open={announcementModal} onCancel={() => setAnnouncementModal(false)} onOk={() => annForm.submit()} width={600}>
        <Form form={annForm} layout="vertical" onFinish={handleCreateAnnouncement}>
          <Form.Item name="title" label="公告标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="输入公告标题" maxLength={200} />
          </Form.Item>
          <Form.Item name="type" label="公告类型" rules={[{ required: true, message: '请选择类型' }]}>
            <Select options={announcementTypeOptions} placeholder="选择公告类型" />
          </Form.Item>
          <Form.Item name="content" label="公告内容" rules={[{ required: true, message: '请输入内容' }]}>
            <Input.TextArea rows={6} placeholder="输入公告详细内容..." />
          </Form.Item>
          <Form.Item name="priority" label="优先级" initialValue={0}>
            <Input type="number" placeholder="数字越大越靠前，默认0" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
