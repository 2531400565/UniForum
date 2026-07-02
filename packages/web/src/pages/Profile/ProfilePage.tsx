import { useEffect, useState, useCallback, useRef } from 'react';
import { Card, Avatar, Typography, Descriptions, Tag, Space, Button, Form, Input, Modal, message, Tabs, List, Empty, Statistic, Upload, Spin } from 'antd';
import { UserOutlined, EditOutlined, TeamOutlined, MailOutlined, CameraOutlined, LockOutlined } from '@ant-design/icons';
import type { UploadRequestOption } from 'rc-upload/lib/interface';
import { useParams, Link, useNavigate } from 'react-router-dom';
import request from '../../api/request';
import { useAuthStore } from '../../stores/useAuthStore';
import dayjs from 'dayjs';
import { ProfileSkeleton } from '../../components/Skeleton';

export default function ProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, updateUser } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [form] = Form.useForm();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [favLoading, setFavLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const tabsRef = useRef<HTMLDivElement>(null);

  // 切换 Tab 并滚动到 Tab 区域
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setTimeout(() => {
      tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // 关注/粉丝/帖子列表数据
  const [followList, setFollowList] = useState<any[]>([]);
  const [followLoading, setFollowLoading] = useState(false);
  const [followTotal, setFollowTotal] = useState(0);
  const [followPage, setFollowPage] = useState(1);
  const [postList, setPostList] = useState<any[]>([]);
  const [postLoading, setPostLoading] = useState(false);
  const [postTotal, setPostTotal] = useState(0);
  const [postListPage, setPostListPage] = useState(1);
  const [pwdOpen, setPwdOpen] = useState(false);
  const [pwdForm] = Form.useForm();
  const [questionList, setQuestionList] = useState<any[]>([]);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [questionTotal, setQuestionTotal] = useState(0);
  const [questionPage, setQuestionPage] = useState(1);
  const [resourceList, setResourceList] = useState<any[]>([]);
  const [resourceLoading, setResourceLoading] = useState(false);
  const [resourceTotal, setResourceTotal] = useState(0);
  const [resourcePage, setResourcePage] = useState(1);

  useEffect(() => {
    request.get(`/users/${id}`).then((res: any) => setProfile(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  // 业主身份时自动加载收藏列表
  useEffect(() => {
    if (currentUser?.id === Number(id)) fetchFavorites();
  }, [id, currentUser?.id]);

  // 切换 Tab 时加载对应数据
  useEffect(() => {
    if (activeTab === 'followings' || activeTab === 'followers') {
      fetchFollowList(activeTab === 'followings' ? 'followings' : 'followers', 1);
    } else if (activeTab === 'posts') {
      fetchUserPosts(1);
    } else if (activeTab === 'questions') {
      fetchUserQuestions(1);
    } else if (activeTab === 'resources') {
      fetchUserResources(1);
    }
  }, [activeTab, id]);

  const fetchFavorites = () => {
    setFavLoading(true);
    request.get('/favorites', { params: { pageSize: 20 } }).then((res: any) => {
      setFavorites(res.data?.list || []);
    }).finally(() => setFavLoading(false));
  };

  const fetchFollowList = useCallback((type: 'followings' | 'followers', page: number) => {
    setFollowLoading(true);
    if (page === 1) setFollowList([]);
    request.get(`/users/${id}/${type}`, { params: { page, pageSize: 20 } }).then((res: any) => {
      const newList = res.data?.list || [];
      setFollowList(prev => page === 1 ? newList : [...prev, ...newList]);
      setFollowTotal(res.data?.total || 0);
      setFollowPage(page);
    }).catch(() => {}).finally(() => setFollowLoading(false));
  }, [id]);

  const fetchUserPosts = useCallback((page: number) => {
    setPostLoading(true);
    if (page === 1) setPostList([]);
    request.get('/posts', { params: { authorId: id, page, pageSize: 10 } }).then((res: any) => {
      const newList = res.data?.list || [];
      setPostList(prev => page === 1 ? newList : [...prev, ...newList]);
      setPostTotal(res.data?.total || 0);
      setPostListPage(page);
    }).catch(() => {}).finally(() => setPostLoading(false));
  }, [id]);

  const fetchUserQuestions = useCallback((page: number) => {
    setQuestionLoading(true);
    if (page === 1) setQuestionList([]);
    request.get('/qa/questions', { params: { authorId: id, page, pageSize: 10 } }).then((res: any) => {
      const newList = res.data?.list || [];
      setQuestionList(prev => page === 1 ? newList : [...prev, ...newList]);
      setQuestionTotal(res.data?.total || 0);
      setQuestionPage(page);
    }).catch(() => {}).finally(() => setQuestionLoading(false));
  }, [id]);

  const fetchUserResources = useCallback((page: number) => {
    setResourceLoading(true);
    if (page === 1) setResourceList([]);
    request.get('/resources', { params: { uploaderId: id, page, pageSize: 10 } }).then((res: any) => {
      const newList = res.data?.list || [];
      setResourceList(prev => page === 1 ? newList : [...prev, ...newList]);
      setResourceTotal(res.data?.total || 0);
      setResourcePage(page);
    }).catch(() => {}).finally(() => setResourceLoading(false));
  }, [id]);

  const handlePasswordChange = async (values: any) => {
    try {
      await request.put(`/users/${id}/password`, { oldPassword: values.oldPassword, newPassword: values.newPassword });
      message.success('密码修改成功，请重新登录');
      setPwdOpen(false); pwdForm.resetFields();
    } catch (err: any) { message.error(err.message); }
  };

  const handleAvatarUpload = async (options: UploadRequestOption) => {
    const { file } = options;
    const formData = new FormData();
    formData.append('avatar', file as File);
    setUploading(true);
    try {
      const res: any = await request.put(`/users/${id}/avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newUrl = res.data.avatarUrl;
      setAvatarUrl(newUrl);
      setProfile((prev: any) => prev ? { ...prev, avatar_url: newUrl } : prev);
      if (currentUser?.id === Number(id)) updateUser({ avatarUrl: newUrl });
      message.success('头像更新成功');
    } catch (err: any) {
      message.error(err.message || '头像上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = async (values: any) => {
    try {
      await request.put(`/users/${id}`, values);
      message.success('更新成功'); setEditOpen(false);
      if (currentUser?.id === Number(id)) updateUser(values);
      request.get(`/users/${id}`).then((res: any) => setProfile(res.data));
    } catch (err: any) { message.error(err.message); }
  };

  const handleFollow = async () => {
    try {
      await request.post(`/users/${id}/follow`);
      message.success('关注成功');
      request.get(`/users/${id}`).then((res: any) => setProfile(res.data));
    } catch (err: any) { message.error(err.message); }
  };

  const handleUnfollow = async () => {
    try {
      await request.delete(`/users/${id}/follow`);
      message.success('已取消关注');
      request.get(`/users/${id}`).then((res: any) => setProfile(res.data));
    } catch (err: any) { message.error(err.message); }
  };

  const handleSendMessage = async () => {
    try {
      const res: any = await request.post('/conversations/start', { targetUserId: Number(id) });
      navigate(`/messages/${res.data.conversationId}`, { state: { targetUserId: Number(id) } });
    } catch (err: any) { message.error(err.message || '发起会话失败'); }
  };

  if (loading) return <ProfileSkeleton />;
  if (!profile) return <div style={{ textAlign: 'center', padding: 100 }}>用户不存在</div>;

  const isOwner = currentUser?.id === profile.id;

  // 用户列表渲染（关注/粉丝通用）
  const renderUserList = (type: 'followings' | 'followers') => (
    <List
      loading={followLoading && followList.length === 0}
      dataSource={followList}
      locale={{ emptyText: <Empty description={type === 'followings' ? '暂无关注' : '暂无粉丝'} /> }}
      renderItem={(item: any) => (
        <List.Item style={{ cursor: 'pointer' }} onClick={() => navigate(`/profile/${item.id}`)}>
          <List.Item.Meta
            avatar={<Avatar src={item.avatar_url} icon={<UserOutlined />} size={40} />}
            title={<Typography.Text strong>{item.nickname}</Typography.Text>}
            description={item.department || ''}
          />
        </List.Item>
      )}
      loadMore={
        followList.length < followTotal ? (
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <Button onClick={() => fetchFollowList(type, followPage + 1)} loading={followLoading}>
              加载更多
            </Button>
          </div>
        ) : null
      }
    />
  );

  // 帖子列表渲染
  const renderPostList = () => (
    <List
      loading={postLoading && postList.length === 0}
      dataSource={postList}
      locale={{ emptyText: <Empty description="暂无帖子" /> }}
      renderItem={(item: any) => (
        <List.Item>
          <List.Item.Meta
            title={<Link to={`/forum/post/${item.id}`}>{item.title}</Link>}
            description={
              <Space>
                <Tag>{item.board?.name}</Tag>
                <Typography.Text type="secondary">{dayjs(item.created_at).format('YYYY-MM-DD')}</Typography.Text>
                <Typography.Text type="secondary">♥ {item.like_count} 💬 {item.comment_count}</Typography.Text>
              </Space>
            }
          />
        </List.Item>
      )}
      loadMore={
        postList.length < postTotal ? (
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <Button onClick={() => fetchUserPosts(postListPage + 1)} loading={postLoading}>
              加载更多
            </Button>
          </div>
        ) : null
      }
    />
  );

  // 构建 Tab 列表
  const tabItems: any[] = [
    { key: 'posts', label: `帖子 ${profile.postCount || 0}`, children: renderPostList() },
    { key: 'followings', label: `关注 ${profile.followingCount || 0}`, children: renderUserList('followings') },
    { key: 'followers', label: `粉丝 ${profile.followerCount || 0}`, children: renderUserList('followers') },
  ];

  tabItems.push({
    key: 'questions',
    label: `问答 ${profile.questionCount || questionTotal}`, children: (
      <List
        loading={questionLoading && questionList.length === 0}
        dataSource={questionList}
        locale={{ emptyText: <Empty description="暂无提问" /> }}
        renderItem={(item: any) => (
          <List.Item>
            <List.Item.Meta
              title={<Link to={`/qa/${item.id}`}>{item.title}</Link>}
              description={
                <Space>
                  <Tag color={item.status === 'resolved' ? 'green' : 'orange'}>{item.status === 'resolved' ? '已解决' : '待解答'}</Tag>
                  <Tag>{item.category}</Tag>
                  <Typography.Text type="secondary">{item.answer_count}回答 · {item.view_count}浏览</Typography.Text>
                  <Typography.Text type="secondary">{dayjs(item.created_at).format('YYYY-MM-DD')}</Typography.Text>
                </Space>
              }
            />
          </List.Item>
        )}
        loadMore={questionList.length < questionTotal ? (
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <Button onClick={() => fetchUserQuestions(questionPage + 1)} loading={questionLoading}>加载更多</Button>
          </div>
        ) : null}
      />
    ),
  });
  tabItems.push({
    key: 'resources',
    label: `资源 ${profile.resourceCount || resourceTotal}`, children: (
      <List
        loading={resourceLoading && resourceList.length === 0}
        dataSource={resourceList}
        locale={{ emptyText: <Empty description="暂无资源" /> }}
        renderItem={(item: any) => (
          <List.Item>
            <List.Item.Meta
              title={<Typography.Text strong>{item.title}</Typography.Text>}
              description={
                <Space>
                  <Tag>{item.category}</Tag>
                  {item.subject && <Tag color="blue">{item.subject}</Tag>}
                  <Typography.Text type="secondary">{item.download_count}下载</Typography.Text>
                  <Typography.Text type="secondary">{dayjs(item.created_at).format('YYYY-MM-DD')}</Typography.Text>
                </Space>
              }
            />
          </List.Item>
        )}
        loadMore={resourceList.length < resourceTotal ? (
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <Button onClick={() => fetchUserResources(resourcePage + 1)} loading={resourceLoading}>加载更多</Button>
          </div>
        ) : null}
      />
    ),
  });

  if (isOwner) {
    tabItems.push({
      key: 'favorites',
      label: `收藏 ${favorites.length}`,
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
    });
  }

  return (
    <div className="page-container" style={{ maxWidth: 700 }}>
      <Card>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Avatar size={80} src={avatarUrl || profile.avatar_url} icon={<UserOutlined />} />
          <Typography.Title level={3} style={{ marginTop: 12 }}>{profile.nickname}</Typography.Title>
          <Tag color={profile.role === 'admin' ? 'red' : profile.role === 'moderator' ? 'blue' : 'default'}>
            {profile.role === 'admin' ? '管理员' : profile.role === 'moderator' ? '版主' : '用户'}
          </Tag>
          <div style={{ marginTop: 12 }}>
            <Space size="large">
              <div onClick={() => handleTabChange('followings')} style={{ cursor: 'pointer' }}>
                <Statistic title="关注" value={profile.followingCount || 0} valueStyle={{ color: '#1677ff' }} />
              </div>
              <div onClick={() => handleTabChange('followers')} style={{ cursor: 'pointer' }}>
                <Statistic title="粉丝" value={profile.followerCount || 0} valueStyle={{ color: '#1677ff' }} />
              </div>
              <div onClick={() => handleTabChange('posts')} style={{ cursor: 'pointer' }}>
                <Statistic title="帖子" value={profile.postCount || 0} valueStyle={{ color: '#1677ff' }} />
              </div>
            </Space>
          </div>
          {!isOwner && currentUser && (
            <div style={{ marginTop: 12 }}>
              {profile.isFollowed ? (
                <Button onClick={handleUnfollow}>取消关注</Button>
              ) : (
                <Button type="primary" icon={<TeamOutlined />} onClick={handleFollow}>关注</Button>
              )}
              <Button icon={<MailOutlined />} onClick={handleSendMessage}>发消息</Button>
            </div>
          )}
        </div>
        <Descriptions column={1} bordered>
          <Descriptions.Item label="邮箱">{profile.email}</Descriptions.Item>
          <Descriptions.Item label="学号">{profile.student_id || '-'}</Descriptions.Item>
          <Descriptions.Item label="院系">{profile.department || '-'}</Descriptions.Item>
          <Descriptions.Item label="年级">{profile.grade || '-'}</Descriptions.Item>
          <Descriptions.Item label="简介">{profile.bio || '-'}</Descriptions.Item>
          <Descriptions.Item label="资源数">{profile.resourceCount || 0}</Descriptions.Item>
        </Descriptions>
        {isOwner && <Space style={{ marginTop: 16 }}>
          <Button type="primary" icon={<EditOutlined />} onClick={() => { setEditOpen(true); form.setFieldsValue(profile); }}>编辑资料</Button>
          <Button icon={<LockOutlined />} onClick={() => setPwdOpen(true)}>修改密码</Button>
        </Space>}
      </Card>

      <Card ref={tabsRef as any} style={{ marginTop: 16 }}>
        <Tabs activeKey={activeTab} onChange={handleTabChange} items={tabItems} />
      </Card>

      <Modal title="修改密码" open={pwdOpen} onCancel={() => setPwdOpen(false)} onOk={() => pwdForm.submit()} width={400}>
        <Form form={pwdForm} layout="vertical" onFinish={handlePasswordChange}>
          <Form.Item name="oldPassword" label="旧密码" rules={[{ required: true, message: '请输入旧密码' }]}>
            <Input.Password placeholder="请输入旧密码" />
          </Form.Item>
          <Form.Item name="newPassword" label="新密码" rules={[{ required: true, min: 6, message: '密码至少6位' }]}>
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
          <Form.Item name="confirmNewPassword" dependencies={['newPassword']} rules={[
            { required: true, message: '请确认新密码' },
            ({ getFieldValue }: any) => ({
              validator(_: any, value: any) {
                if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                return Promise.reject(new Error('两次输入的密码不一致'));
              },
            }),
          ]}>
            <Input.Password placeholder="请确认新密码" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="编辑资料" open={editOpen} onCancel={() => setEditOpen(false)} onOk={() => form.submit()} width={420}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Avatar size={100} src={avatarUrl || profile?.avatar_url} icon={<UserOutlined />} style={{ marginBottom: 12 }} />
          <br />
          <Upload
            showUploadList={false}
            customRequest={handleAvatarUpload}
            accept="image/jpeg,image/png,image/webp"
            disabled={uploading}
          >
            <Button icon={<CameraOutlined />} loading={uploading} size="small">{uploading ? '上传中...' : '更换头像'}</Button>
          </Upload>
          <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>支持 jpg/png/webp，最大 2MB</Typography.Text>
        </div>
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
