/**
 * InPageSelect 组件相关类型定义
 */

/**
 * 加载数据的参数
 */
export interface LoadDataParams {
  /** 当前页码 */
  current: number;
  /** 每页数量 */
  size: number;
  /** 搜索关键词（用户输入的文本） */
  query?: string;
}

/**
 * 组件暴露的方法
 */
export interface InPageSelectExpose {
  /** 刷新数据（重置到第一页） */
  refresh: () => void;
  /** 手动加载更多数据 */
  loadMore: () => void;
}

