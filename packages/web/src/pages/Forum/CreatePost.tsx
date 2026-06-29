import { useState, useEffect, useRef } from 'react';
import { Form, Input, Select, Button, Card, message } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import request from '../../api/request';

export default function CreatePost() {
  const navigate = useNavigate();
  const location = useLocation();
  const [boards, setBoards] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');
  const [boardId, setBoardId] = useState<number | undefined>((location.state as any)?.boardId);
  const [title, setTitle] = useState('');
  const quillRef = useRef<any>(null);

  useEffect(() => {
    request.get('/boards').then((res: any) => setBoards(res.data || []));
  }, []);

  // 图片上传处理
  const imageHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/jpeg,image/png,image/gif,image/webp');
    input.click();
    input.onchange = async () => {
      if (!input.files || !input.files[0]) return;
      const file = input.files[0];
      if (file.size > 5 * 1024 * 1024) {
        message.error('图片大小不能超过5MB');
        return;
      }
      const formData = new FormData();
      formData.append('image', file);
      try {
        const res: any = await request.post('/upload/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const imgUrl = res.data?.url;
        if (imgUrl) {
          const quill = quillRef.current?.getEditor();
          if (quill) {
            const range = quill.getSelection(true);
            quill.insertEmbed(range.index, 'image', imgUrl);
            quill.setSelection(range.index + 1);
          }
        }
      } catch (err: any) {
        message.error('图片上传失败');
      }
    };
  };

  const modules = {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ color: [] }, { background: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ align: [] }],
        ['link', 'image'],
        ['clean'],
      ],
      handlers: { image: imageHandler },
    },
  };

  const handleSubmit = async () => {
    if (!boardId) return message.error('请选择版块');
    if (!title.trim()) return message.error('请输入标题');
    if (!content.trim() || content === '<p><br></p>') return message.error('请输入内容');
    setLoading(true);
    try {
      const res: any = await request.post('/posts', { title, content, boardId });
      message.success('发帖成功');
      navigate(`/forum/post/${res.data.id}`);
    } catch (err: any) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: 800 }}>
      <Card title="发布新帖">
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>版块</label>
          <Select
            placeholder="选择版块"
            value={boardId}
            onChange={setBoardId}
            style={{ width: '100%' }}
            options={boards.map((b: any) => ({ label: b.name, value: b.id }))}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>标题</label>
          <Input placeholder="帖子标题" maxLength={200} value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>内容</label>
          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={content}
            onChange={setContent}
            modules={modules}
            placeholder="写下你的帖子内容，支持图文混排..."
            style={{ minHeight: 300 }}
          />
        </div>
        <Button type="primary" size="large" loading={loading} onClick={handleSubmit}>发布</Button>
      </Card>
    </div>
  );
}
