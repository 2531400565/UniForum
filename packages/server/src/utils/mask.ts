/**
 * 敏感信息脱敏工具
 */

// 邮箱脱敏: a***b@example.com
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }
  return `${local[0]}${'*'.repeat(Math.min(local.length - 2, 4))}${local[local.length - 1]}@${domain}`;
}

// 手机号脱敏: 138****1234
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) return phone;
  const clean = phone.replace(/\D/g, '');
  if (clean.length >= 11) {
    return `${clean.slice(0, 3)}****${clean.slice(-4)}`;
  }
  return `${clean.slice(0, 3)}****${clean.slice(-2)}`;
}

// 学号脱敏: 2021***12
export function maskStudentId(id: string): string {
  if (!id || id.length < 4) return id;
  return `${id.slice(0, 4)}${'*'.repeat(Math.min(id.length - 6, 4))}${id.slice(-2)}`;
}

// 通用脱敏: 保留首尾，中间用*替换
export function maskString(str: string, visibleStart = 1, visibleEnd = 1): string {
  if (!str || str.length <= visibleStart + visibleEnd) return str;
  const start = str.slice(0, visibleStart);
  const end = str.slice(-visibleEnd);
  const middle = '*'.repeat(Math.min(str.length - visibleStart - visibleEnd, 6));
  return `${start}${middle}${end}`;
}

// 判断是否为手机号
export function isPhone(str: string): boolean {
  return /^1[3-9]\d{9}$/.test(str);
}

// 智能脱敏：根据内容类型自动选择脱敏方式
export function smartMask(str: string, isOwner = false): string {
  if (!str) return str;
  // 本人查看自己的信息不脱敏
  if (isOwner) return str;
  if (str.includes('@')) return maskEmail(str);
  if (isPhone(str)) return maskPhone(str);
  return maskString(str);
}
