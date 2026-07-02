import { useState, useRef, useEffect } from 'react';
import { Card, Input, Button, Typography, Space, Avatar, Spin } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined, ArrowLeftOutlined, ClearOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import request from '../../api/request';
import { useAuthStore } from '../../stores/useAuthStore';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

marked.setOptions({ breaks: true, gfm: true });

function renderMarkdown(content: string): string {
  const html = marked.parse(content) as string;
  return DOMPurify.sanitize(html);
}

const STORAGE_KEY = 'ai_chat_messages';

const { Text, Paragraph } = Typography;

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIChat() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 从 localStorage 加载历史对话
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
      } catch { /* ignore */ }
    }
  }, []);

  // 保存对话到 localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [messages]);

  // 发送消息
  const handleSend = async () => {
    const content = inputValue.trim();
    if (!content || loading) return;

    // 添加用户消息
    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      // 构建对话历史（发送最近10条消息给AI）
      const chatHistory = [...messages, userMessage].slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      const res: any = await request.post('/ai/chat', {
        messages: chatHistory,
      });

      if (res.data?.answer) {
        const aiMessage: Message = {
          id: Date.now() + 1,
          role: 'assistant',
          content: res.data.answer,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (err: any) {
      // 添加错误消息
      const errorMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: '抱歉，AI 服务暂时不可用，请稍后重试。',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // 清空对话
  const handleClear = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  // 回车发送
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: 800, height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}>
      {/* 标题栏 */}
      <Card size="small" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/qa')} />
            <RobotOutlined style={{ fontSize: 20, color: '#1677ff' }} />
            <Text strong style={{ fontSize: 16 }}>AI 助手</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>由 DeepSeek 驱动</Text>
          </Space>
          <Button icon={<ClearOutlined />} onClick={handleClear} disabled={messages.length === 0}>
            清空对话
          </Button>
        </div>
      </Card>

      {/* 消息列表 */}
      <Card style={{ flex: 1, overflow: 'auto', marginBottom: 12 }} bodyStyle={{ padding: 16 }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
            <RobotOutlined style={{ fontSize: 48, marginBottom: 16, color: '#1677ff' }} />
            <Paragraph style={{ fontSize: 16, marginBottom: 8 }}>你好！我是 AI 助手</Paragraph>
            <Paragraph type="secondary">你可以问我任何问题，比如学习、生活、技术等方面的问题。</Paragraph>
            <div style={{ marginTop: 24 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {['如何学习编程？', '大学应该考哪些证书？', '如何准备面试？'].map((q, i) => (
                  <Button key={i} style={{ width: '100%', textAlign: 'left' }} onClick={() => { setInputValue(q); }}>
                    {q}
                  </Button>
                ))}
              </Space>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  gap: 8,
                }}
              >
                {msg.role === 'assistant' && (
                  <Avatar
                    icon={<RobotOutlined />}
                    style={{ backgroundColor: '#1677ff', flexShrink: 0 }}
                  />
                )}
                <div
                  style={{
                    maxWidth: '75%',
                    padding: '10px 14px',
                    borderRadius: 12,
                    background: msg.role === 'user' ? '#1677ff' : '#f0f0f0',
                    color: msg.role === 'user' ? '#fff' : 'inherit',
                  }}
                >
                  <div className="post-content" style={{ fontSize: 14 }} dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                  <div
                    style={{
                      fontSize: 11,
                      opacity: 0.6,
                      marginTop: 4,
                      textAlign: 'right',
                    }}
                  >
                    {msg.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                {msg.role === 'user' && (
                  <Avatar
                    icon={<UserOutlined />}
                    src={user?.avatarUrl}
                    style={{ backgroundColor: '#87d068', flexShrink: 0 }}
                  />
                )}
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: 8 }}>
                <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#1677ff' }} />
                <div style={{ padding: '10px 14px', background: '#f0f0f0', borderRadius: 12 }}>
                  <Spin size="small" /> <Text type="secondary" style={{ marginLeft: 8 }}>思考中...</Text>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </Card>

      {/* 输入框 */}
      <Card size="small">
        <div style={{ display: 'flex', gap: 8 }}>
          <Input.TextArea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入你的问题... (Enter 发送，Shift+Enter 换行)"
            autoSize={{ minRows: 1, maxRows: 4 }}
            style={{ flex: 1 }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            loading={loading}
            disabled={!inputValue.trim()}
            style={{ height: 'auto' }}
          >
            发送
          </Button>
        </div>
      </Card>
    </div>
  );
}
