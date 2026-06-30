import sanitizeHtml from 'sanitize-html';

// HTML 净化白名单配置 - 允许富文本中使用的安全标签
const sanitizeOptions: any = {
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr',
    'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del',
    'blockquote', 'pre', 'code',
    'ul', 'ol', 'li',
    'a', 'img',
    'span', 'div',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
  ],
  allowedAttributes: {
    'a': ['href', 'target', 'rel'],
    'img': ['src', 'alt', 'width', 'height', 'style'],
    'span': ['style', 'class'],
    'div': ['style', 'class'],
    'td': ['colspan', 'rowspan'],
    'th': ['colspan', 'rowspan'],
  },
  allowedStyles: {
    '*': {
      'color': [/^#[0-9a-fA-F]{3,6}$/, /^[a-z]+$/],
      'background-color': [/^#[0-9a-fA-F]{3,6}$/, /^[a-z]+$/],
      'background': [/^#[0-9a-fA-F]{3,6}$/, /^[a-z]+$/],
      'text-align': [/^left$/, /^right$/, /^center$/, /^justify$/],
      'font-size': [/^[0-9]+px$/, /^[0-9]+em$/, /^[0-9]+%$/],
    },
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  transformTags: {
    'a': sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
  },
};

export function sanitize(html: string): string {
  return sanitizeHtml(html, sanitizeOptions);
}

// 纯文本净化 - 用于标题等不需要HTML的字段
export function sanitizeText(text: string): string {
  return sanitizeHtml(text, { allowedTags: [] });
}
