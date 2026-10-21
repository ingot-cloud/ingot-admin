/**
 * 取录入框中可见的已选项；未给上限时全部可见。
 */
export function visibleSelection<T>(items: readonly T[], limit?: number): T[] {
  return limit === undefined || limit < 0 ? [...items] : items.slice(0, limit);
}

/**
 * 计算 `+N` 数量：优先使用服务端总数，减去已展示数量，最小为 0。
 */
export function selectionOverflowCount(total: number, visibleCount: number): number {
  return Math.max(0, total - visibleCount);
}
