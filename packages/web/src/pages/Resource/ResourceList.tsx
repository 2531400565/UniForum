import { useEffect, useState } from 'react';
import { List, Typography, Tag, Pagination, Spin, Card, Button, Rate, Space, Upload, Modal, Form, Input, Select, message } from 'antd';
import { FileTextOutlined, UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import request from '../../api/request';
import { useAuthStore } from '../../stores/useAuthStore';
import dayjs from 'dayjs';

const categoryLabels: any = { slides: '课件', notes: '笔记', booklist: '书单', exam: '试题', other: '其他' };

export default function ResourceList() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);

  const fetchData = () => {
    setLoading(true);
    request.get('/resources', { params: { page, pageSize: 15, category: category || undefined } }).then((res: any) => {
      setData(res.data?.list || []); setTotal(res.data?.total || 0);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [page, category]);

  const handleUpload = async (values: any) => {
    const formData = new FormData();
    formData.append('title', values.title);
    formData.append('category', values.category);
    formData.append('description', values.description || '');
    formData.append('subject', values.subject || '');
    if (fileList[0]) formData.append('file', fileList[0].originFileObj);
    try {
      await request.post('/resources', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      message.success('上传成功，等待审核'); setModalOpen(false); form.resetFields(); setFileList([]); fetchData();
    } catch (err: any) { message.error(err.message); }
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={3}><FileTextOutlined /> 学习资源</Typography.Title>
        {isLoggedIn && <Button type="primary" icon={<UploadOutlined />} onClick={() => setModalOpen(true)}>上传资源</Button>}
      </div>
      <Space style={{ marginBottom: 16 }}>
        {['', 'slides', 'notes', 'booklist', 'exam', 'other'].map(k => (
          <Tag.CheckableTag key={k} checked={category === k} onChange={() => { setCategory(k); setPage(1); }}>{k ? categoryLabels[k] : '全部'}</Tag.CheckableTag>
        ))}
      </Space>
      {loading ? <div style={{ textAlign: 'center', padding: 50 }}><Spin /></div> : (
        <List dataSource={data} renderItem={(item: any) => (
          <Card style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><Typography.Text strong style={{ fontSize: 16 }}>{item.title}</Typography.Text>
                <div style={{ marginTop: 4 }}><Tag>{categoryLabels[item.category]}</Tag>{item.subject && <Tag color="blue">{item.subject}</Tag>}
                  <Rate disabled value={item.avg_rating} style={{ fontSize: 14 }} /><Typography.Text type="secondary"> ({item.rating_count})</Typography.Text>
                </div>
                {item.description && <Typography.Paragraph ellipsis type="secondary" style={{ marginTop: 4 }}>{item.description}</Typography.Paragraph>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>{item.file_type.toUpperCase()} · {(item.file_size / 1024).toFixed(0)}KB</Typography.Text>
                <div style={{ marginTop: 4 }}><Typography.Text type="secondary"><DownloadOutlined /> {item.download_count}</Typography.Text></div>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>{item.uploader?.nickname} · {dayjs(item.created_at).format('MM-DD')}</Typography.Text>
                <div style={{ marginTop: 8 }}>
                  <Button type="primary" size="small" icon={<DownloadOutlined />} onClick={async () => {
                    try {
                      const token = localStorage.getItem('accessToken');
                      const resp = await fetch(`/api/v1/resources/${item.id}/download`, {
                        headers: token ? { Authorization: `Bearer ${token}` } : {},
                      });
                      if (!resp.ok) throw new Error('下载失败');
                      const blob = await resp.blob();
                      // 从 Content-Disposition 头提取文件名
                      let filename = item.file_name || `resource_${item.id}`;
                      const disposition = resp.headers.get('Content-Disposition');
                      if (disposition) {
                        const match = disposition.match(/filename\*=UTF-8''(.+?)(?:;|$)/);
                        if (match) filename = decodeURIComponent(match[1]);
                      }
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = filename;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      window.URL.revokeObjectURL(url);
                      message.success('下载成功');
                      fetchData();
                    } catch (err: any) { message.error('下载失败'); }
                  }}>下载</Button>
                </div>
              </div>
            </div>
          </Card>
        )} />
      )}
      <div style={{ textAlign: 'center', marginTop: 16 }}><Pagination current={page} total={total} pageSize={15} onChange={setPage} /></div>

      <Modal title="上传学习资源" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()} width={500}>
        <Form form={form} layout="vertical" onFinish={handleUpload}>
          <Form.Item name="title" label="资源名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="category" label="分类" rules={[{ required: true }]}><Select options={Object.entries(categoryLabels).map(([k, v]) => ({ label: v, value: k }))} /></Form.Item>
          <Form.Item name="subject" label="科目"><Input placeholder="如：高等数学、数据结构" /></Form.Item>
          <Form.Item name="description" label="描述"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item label="文件" required><Upload beforeUpload={() => false} fileList={fileList} onChange={({ fileList }) => setFileList(fileList)} maxCount={1}>
            <Button icon={<UploadOutlined />}>选择文件</Button>
          </Upload></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
