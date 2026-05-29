/** Standart paginatsiya javobi (kelajak API uchun) */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Backend ba'zan to'g'ridan-to'g'ri massiv qaytaradi */
export function normalizeList<T>(data: T[] | PaginatedResponse<T> | undefined | null): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.items ?? [];
}

export function toPaginated<T>(
  items: T[],
  page = 1,
  limit = items.length || 20,
): PaginatedResponse<T> {
  const total = items.length;
  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}
