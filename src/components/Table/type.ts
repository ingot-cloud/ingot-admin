export interface HeaderItem {
  label?: string;
  prop?: string;
  hide?: boolean;
  type?: string;
  width?: string;
  fixed?: string | boolean;
  align?: string;
}

export interface Page {
  current: number;
  size: number;
  total: number;
}
