export function getPagination(page?: any, pageSize?: any) {
  const p = Math.max(1, parseInt(String(page || 1)));
  const ps = Math.min(100, Math.max(1, parseInt(String(pageSize || 20))));
  return { limit: ps, offset: (p - 1) * ps, page: p, pageSize: ps };
}

export function paginatedResult(list: any[], total: number, page: number, pageSize: number) {
  return { list, total, page, pageSize };
}
