import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Input, Select, Button, Card, message, Modal } from 'antd';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import request from '../../api/request';
import { useDraft } from '../../hooks/useDraft';

// 工具栏配置放在组件外部，避免每次渲染重建
const TOOLBAR_CONFIG = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike', 'blockquote'],
  [{ color: [] }, { background: [] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ align: [] }],
  ['link', 'image'],
  ['clean'],
];

export default function CreatePost() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: editId } = useParams();
  const isEdit = !!editId;
  const [boards, setBoards] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');
  const [boardId, setBoardId] = useState<number | undefined>((location.state as any)?.boardId);
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagOptions, setTagOptions] = useState<any[]>([]);
  const quillRef = useRef<any>(null);
  const { saveDraft, loadDraft, clearDraft, updateRefs } = useDraft(isEdit ? `edit_${editId}` : 'new_post');

  useEffect(() => {
    request.get('/boards').then((res: any) => setBoards(res.data || []));
    request.get('/tags').then((res: any) => setTagOptions((res.data || []).map((t: any) => ({ label: t.name, value: t.name }))));
  }, []);

  // 编辑模式加载现有数据
  useEffect(() => {
    if (isEdit) {
      request.get(`/posts/${editId}`).then((res: any) => {
        const post = res.data;
        setTitle(post.title);
        setContent(post.content);
        setBoardId(post.board_id);
        if (post.tags) setTags(post.tags.map((t: any) => t.name));
      }).catch(() => message.error('加载帖子失败'));
    }
  }, [editId, isEdit]);

  // 加载草稿
  useEffect(() => {
    if (!isEdit) {
      const draft = loadDraft();
      if (draft) {
        Modal.confirm({
          title: '发现未保存的草稿',
          content: `草稿保存于 ${new Date(draft.savedAt).toLocaleString()}，是否恢复？`,
          okText: '恢复',
          cancelText: '丢弃',
          onOk: () => {
            setTitle(draft.title);
            setContent(draft.content);
            if (draft.boardId) setBoardId(draft.boardId);
            if (draft.tags) setTags(draft.tags);
          },
          onCancel: () => clearDraft(),
        });
      }
    }
  }, [isEdit]);

  // 同步更新草稿引用
  useEffect(() => {
    updateRefs(title, content, boardId, tags);
  }, [title, content, boardId, tags, updateRefs]);

  // 图片上传处理 - 使用 ref 保存最新引用
  const imageHandlerRef = useRef<() => void>();
  imageHandlerRef.current = () => {
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

  // modules 使用 useMemo 缓存，只在组件挂载时创建一次
  const modules = useMemo(() => ({
    toolbar: {
      container: TOOLBAR_CONFIG,
      handlers: {
        image: () => imageHandlerRef.current?.(),
      },
    },
  }), []);

  const handleSubmit = async () => {
    if (!boardId) return message.error('请选择版块');
    if (!title.trim()) return message.error('请输入标题');
    if (!content.trim() || content === '<p><br></p>') return message.error('请输入内容');
    setLoading(true);
    try {
      if (isEdit) {
        await request.put(`/posts/${editId}`, { title, content, boardId, tags });
        message.success('更新成功');
        navigate(`/forum/post/${editId}`);
      } else {
        const res: any = await request.post('/posts', { title, content, boardId, tags });
        message.success('发帖成功');
        clearDraft();
        navigate(`/forum/post/${res.data.id}`);
      }
    } catch (err: any) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Ctrl+Enter 快捷发布
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: 800 }} onKeyDown={handleKeyDown}>
      <Card title={isEdit ? '编辑帖子' : '发布新帖'}>
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
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>标签</label>
          <Select
            mode="tags"
            placeholder="输入或选择标签"
            value={tags}
            onChange={setTags}
            style={{ width: '100%' }}
            options={tagOptions}
            maxTagCount={5}
          />
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
        <Button type="primary" size="large" loading={loading} onClick={handleSubmit}>{isEdit ? '保存修改' : '发布 (Ctrl+Enter)'}</Button>
        {!isEdit && <Button size="large" style={{ marginLeft: 12 }} onClick={() => { saveDraft(title, content, boardId, tags); message.success('草稿已保存'); }}>保存草稿</Button>}
      </Card>
    </div>
  );
}
