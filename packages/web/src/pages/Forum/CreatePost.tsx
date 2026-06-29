import { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Card, message } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import request from '../../api/request';

export default function CreatePost() {
  const navigate = useNavigate();
  const location = useLocation();
  const [boards, setBoards] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    request.get('/boards').then((res: any) => setBoards(res.data || []));
  }, []);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const res: any = await request.post('/posts', values);
      if (res.code === 200 || res.code === 201) {
        message.success('发帖成功');
        navigate(`/forum/post/${res.data.id}`);
      } else {
        message.error(res.message);
      }
    } catch (err: any) { message.error(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="page-container" style={{ maxWidth: 700 }}>
      <Card title="发布新帖">
        <Form onFinish={onFinish} layout="vertical" initialValues={{ boardId: (location.state as any)?.boardId }}>
          <Form.Item name="boardId" label="版块" rules={[{ required: true, message: '请选择版块' }]}>
            <Select placeholder="选择版块" options={boards.map((b: any) => ({ label: b.name, value: b.id }))} />
          </Form.Item>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="帖子标题" maxLength={200} />
          </Form.Item>
          <Form.Item name="content" label="内容" rules={[{ required: true, message: '请输入内容' }]}>
            <Input.TextArea rows={10} placeholder="帖子内容..." />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} size="large">发布</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
