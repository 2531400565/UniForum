import { useEffect, useState } from 'react';
import { Card, Avatar, Typography, Descriptions, Tag, Space, Spin, Button, Form, Input, Modal, message, Tabs, List, Empty } from 'antd';
import { UserOutlined, EditOutlined } from '@ant-design/icons';
import { useParams, Link } from 'react-router-dom';
import request from '../../api/request';
import { useAuthStore } from '../../stores/useAuthStore';
import dayjs from 'dayjs';

export default function ProfilePage() {
  const { id } = useParams();
  const { user: currentUser, updateUser } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [form] = Form.useForm();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [favLoading, setFavLoading] = useState(false);

  useEffect(() => {
    request.get(`/users/${id}`).then((res: any) => setProfile(res.data)).finally(() => setLoading(false));
  }, [id]);

  const fetchFavorites = () => {
    setFavLoading(true);
    request.get('/favorites', { params: { pageSize: 20 } }).then((res: any) => {
      setFavorites(res.data?.list || []);
    }).finally(() => setFavLoading(false));
  };

  const handleEdit = async (values: any) => {
    try {
      await request.put(`/users/${id}`, values);
      message.success('更新成功'); setEditOpen(false);
      if (currentUser?.id === Number(id)) updateUser(values);
      request.get(`/users/${id}`).then((res: any) => setProfile(res.data));
    } catch (err: any) { message.error(err.message); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>;
  if (!profile) return <div style={{ textAlign: 'center', padding: 100 }}>用户不存在</div>;

  const isOwner = currentUser?.id === profile.id;

  return (
    <div className="page-container" style={{ maxWidth: 700 }}>
      <Card>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Avatar size={80} src={profile.avatar_url} icon={<UserOutlined />} />
          <Typography.Title level={3} style={{ marginTop: 12 }}>{profile.nickname}</Typography.Title>
          <Tag color={profile.role === 'admin' ? 'red' : profile.role === 'moderator' ? 'blue' : 'default'}>
            {profile.role === 'admin' ? '管理员' : profile.role === 'moderator' ? '版主' : '用户'}
          </Tag>
        </div>
        <Descriptions column={1} bordered>
          <Descriptions.Item label="邮箱">{profile.email}</Descriptions.Item>
          <Descriptions.Item label="学号">{profile.student_id || '-'}</Descriptions.Item>
          <Descriptions.Item label="院系">{profile.department || '-'}</Descriptions.Item>
          <Descriptions.Item label="年级">{profile.grade || '-'}</Descriptions.Item>
          <Descriptions.Item label="简介">{profile.bio || '-'}</Descriptions.Item>
          <Descriptions.Item label="发帖数">{profile.postCount || 0}</Descriptions.Item>
          <Descriptions.Item label="资源数">{profile.resourceCount || 0}</Descriptions.Item>
        </Descriptions>
        {isOwner && <Button type="primary" icon={<EditOutlined />} style={{ marginTop: 16 }} onClick={() => { setEditOpen(true); form.setFieldsValue(profile); }}>编辑资料</Button>}
      </Card>

      {isOwner && (
        <Card style={{ marginTop: 16 }}>
          <Tabs items={[{
            key: 'favorites',
            label: `我的收藏 (${favorites.length})`,
            children: (
              <List
                loading={favLoading}
                dataSource={favorites}
                locale={{ emptyText: <Empty description="暂无收藏" /> }}
                renderItem={(item: any) => (
                  <List.Item>
                    <List.Item.Meta
                      title={<Link to={`/forum/post/${item.id}`}>{item.title}</Link>}
                      description={
                        <Space>
                          <Tag>{item.board?.name}</Tag>
                          <Typography.Text type="secondary">{item.author?.nickname}</Typography.Text>
                          <Typography.Text type="secondary">{dayjs(item.created_at).format('YYYY-MM-DD')}</Typography.Text>
                          <Typography.Text type="secondary">♥ {item.like_count} 💬 {item.comment_count}</Typography.Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ),
          }]} onChange={() => fetchFavorites()} />
        </Card>
      )}

      <Modal title="编辑资料" open={editOpen} onCancel={() => setEditOpen(false)} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={handleEdit}>
          <Form.Item name="nickname" label="昵称"><Input /></Form.Item>
          <Form.Item name="department" label="院系"><Input /></Form.Item>
          <Form.Item name="grade" label="年级"><Input /></Form.Item>
          <Form.Item name="bio" label="个人简介"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
