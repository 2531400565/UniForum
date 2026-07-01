import { Response } from 'express';
import { success, fail } from '../utils/response';
import { AuthRequest } from '../middlewares/auth';
import { sanitizeText } from '../utils/sanitize';
import axios from 'axios';

// DeepSeek API 配置
const AI_CONFIG = {
  apiKey: process.env.AI_API_KEY || 'sk-4280b2e72e604f3b9bc52a8ec142c44a',
  baseUrl: 'https://api.deepseek.com',
  model: 'deepseek-chat',
};

// 系统提示词
const SYSTEM_PROMPT = '你是一个专业的校园问答助手，擅长回答大学生的学习、生活、实习、就业、技术等问题。请用简洁、专业的语言回答问题，给出实用的建议。如果问题是中文，请用中文回答。回答时保持友好和耐心。';

/**
 * AI 对话接口 - 支持多轮对话
 * 接收对话历史，返回 AI 的回复
 */
export async function chatWithAI(req: AuthRequest, res: Response) {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return fail(res, '请提供对话内容');
    }

    // 构建消息列表（添加系统提示词）
    const chatMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    // 调用 DeepSeek API
    const response = await axios.post(
      `${AI_CONFIG.baseUrl}/chat/completions`,
      {
        model: AI_CONFIG.model,
        messages: chatMessages,
        temperature: 0.7,
        max_tokens: 1500,
      },
      {
        headers: {
          'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const aiAnswer = response.data.choices?.[0]?.message?.content;

    if (!aiAnswer) {
      return fail(res, 'AI 未能生成回答，请稍后重试');
    }

    // 净化输出内容
    const safeAnswer = sanitizeText(aiAnswer);

    return success(res, { answer: safeAnswer });
  } catch (error: any) {
    console.error('AI 请求失败:', error.message);
    
    if (error.response?.status === 401) {
      return fail(res, 'AI 服务认证失败，请联系管理员');
    }
    if (error.response?.status === 429) {
      return fail(res, 'AI 服务请求过于频繁，请稍后重试');
    }
    
    return fail(res, 'AI 服务暂时不可用，请稍后重试', 500);
  }
}
