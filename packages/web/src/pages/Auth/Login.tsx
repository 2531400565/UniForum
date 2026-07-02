import { useState } from 'react';
import { Form, Input, Button, Card, message, Typography, Modal } from 'antd';
import { UserOutlined, LockOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import request from '../../api/request';
import { useAuthStore } from '../../stores/useAuthStore';

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const res: any = await request.post('/auth/login', values);
      if (res.code === 200) {
        setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);
        message.success('登录成功');
        navigate('/');
      } else {
        message.error(res.message);
      }
    } catch (err: any) {
      message.error(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <Card style={{ width: 400 }}>
        <Typography.Title level={3} style={{ textAlign: 'center' }}>登录 UniForum</Typography.Title>
        <Form onFinish={onFinish} layout="vertical">
          <Form.Item name="email" rules={[{ required: true, message: '请输入邮箱' }]}>
            <Input prefix={<UserOutlined />} placeholder="邮箱" size="large" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">登录</Button>
          </Form.Item>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button type="link" style={{ paddingLeft: 0 }} icon={<QuestionCircleOutlined />} onClick={() => {
              Modal.info({
                title: '忘记密码',
                content: '请联系管理员重置密码，提供你的注册邮箱信息即可。',
                okText: '知道了',
              });
            }}>忘记密码？</Button>
            <span>还没有账号？<Link to="/register">立即注册</Link></span>
          </div>
        </Form>
      </Card>
    </div>
  );
}
