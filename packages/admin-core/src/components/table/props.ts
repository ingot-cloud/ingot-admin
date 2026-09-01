import type { TableHeaderRecord, TablePage } from "./types";
import { TreeListKeyAndProps } from "@/models";

// 简化的 treeProps 类型定义
export interface SimpleTreeProps {
  hasChildren?: string;
  children?: string;
}

export interface ExtendTableProps {
  headers?: Array<TableHeaderRecord>;
  page?: TablePage;
  loading?: boolean;
  radioKey?: string;
  hideSetting?: boolean;
  pageSize?: Array<number>;
  pageLayout?: string;
}

// 手动定义所有需要的表格属性，避免复杂的类型继承
export interface InTableProps extends ExtendTableProps {
  data?: any[];
  stripe?: boolean;
  border?: boolean;
  fit?: boolean;
  showHeader?: boolean;
  highlightCurrentRow?: boolean;
  defaultExpandAll?: boolean;
  defaultSort?: any;
  tooltipEffect?: 'dark' | 'light';
  tooltipOptions?: any;
  showSummary?: boolean;
  sumText?: string;
  selectOnIndeterminate?: boolean;
  indent?: number;
  lazy?: boolean;
  treeProps?: SimpleTreeProps;
  tableLayout?: 'fixed' | 'auto';
  scrollbarAlwaysOn?: boolean;
  flexible?: boolean;
  allowDragLastColumn?: boolean;
  preserveExpandedContent?: boolean;
  rowKey?: string | ((row: any) => string);
  expandRowKeys?: any[];
  height?: string | number;
  maxHeight?: string | number;
  size?: 'large' | 'default' | 'small';
  emptyText?: string;
  cellClassName?: string | ((data: any) => string);
  cellStyle?: any;
  headerCellClassName?: string | ((data: any) => string);
  headerCellStyle?: any;
  rowClassName?: string | ((data: any) => string);
  rowStyle?: any;
  headerRowClassName?: string | ((data: any) => string);
  headerRowStyle?: any;
  currentRowKey?: string | number;
  spanMethod?: (data: any) => number[] | { rowspan: number; colspan: number };
  summaryMethod?: (data: any) => string[];
  load?: (row: any, treeNode: any, resolve: Function) => void;
}

export const DefaultProps = {
  loading: false,
  hideSetting: false,
  headers: () => [],
  page: () => ({
    current: 1,
    size: 20,
    total: 0,
  }),
  pageSize: () => [20, 30, 40, 50],
  pageLayout: () => "total, sizes, prev, pager, next, jumper",
  // ElTable
  data: () => [],
  stripe: false,
  border: false,
  fit: true,
  showHeader: true,
  highlightCurrentRow: false,
  defaultExpandAll: false,
  defaultSort: undefined,
  tooltipEffect: "dark" as const,
  tooltipOptions: () => ({
    enterable: true,
    placement: "top",
    showArrow: true,
    hideAfter: 200,
    popperOptions: { strategy: "fixed" },
  }),
  showSummary: false,
  sumText: "合计",
  selectOnIndeterminate: false,
  indent: 16,
  lazy: false,
  treeProps: (): SimpleTreeProps => TreeListKeyAndProps.props,
  tableLayout: "fixed" as const,
  scrollbarAlwaysOn: false,
  flexible: false,
  allowDragLastColumn: true,
  preserveExpandedContent: false,
  rowKey: TreeListKeyAndProps.key,
  expandRowKeys: undefined,
};
