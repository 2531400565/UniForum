const typeLabels: any = {
  comment: '评论', reply: '回复', like: '点赞', system: '系统', adopt: '采纳', message: '私信',
};

export function getNotificationLink(n: any): string {
  // 优先根据 target_type 判断跳转目标
  if (n.target_type === 'conversation') return `/messages/${n.target_id}`;
  if (n.target_type === 'question') return `/qa/${n.target_id}`;
  if (n.target_type === 'post') return `/forum/post/${n.target_id}`;
  if (n.target_type === 'user') return `/profile/${n.target_id}`;
  // Fallback: 旧通知无 target_type，按 type 推断（adopt 必须在 comment 之前）
  if (n.type === 'adopt') return `/qa/${n.target_id}`;
  if (n.type === 'message') return `/messages`;
  if (n.type === 'comment' || n.type === 'reply' || n.type === 'like') return `/forum/post/${n.target_id}`;
  return '/notifications';
}

export function getNotifTypeLabel(n: any): string {
  if (n.target_type === 'question' && n.type === 'comment') return '回答';
  if (n.target_type === 'user') return '关注';
  return typeLabels[n.type] || n.type;
}
