/**
 * Element Plus `TableColumnRenderer` 为发现嵌套列，会用
 * `{ row: {}, column: {}, $index: -1 }` 调用列默认插槽。
 * 该探测行不是业务数据，不得转发给页面单元格插槽。
 */
export function isTableColumnProbe(scope: { $index?: number } | null | undefined): boolean {
  return scope?.$index === -1;
}
