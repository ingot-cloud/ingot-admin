export const DEFAULT_SKELETON_ROWS = 8;

export const resolveSkeletonRowCount = (pageSize?: number): number => {
  if (!pageSize || pageSize < 1) {
    return DEFAULT_SKELETON_ROWS;
  }
  return Math.min(pageSize, DEFAULT_SKELETON_ROWS);
};
