export function formatSelectionColumnLabel(label: string, selectedCount: number): string {
  if (selectedCount <= 0) {
    return label;
  }
  return `${label} · 已选 ${selectedCount} 条`;
}
