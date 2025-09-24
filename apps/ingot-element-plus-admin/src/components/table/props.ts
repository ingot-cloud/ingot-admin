import type { TableHeaderRecord, TablePage } from "./types";
import { TreeListKeyAndProps } from "@/models";
import { type TableProps } from "element-plus";

export interface ExtendTableProps {
  headers?: Array<TableHeaderRecord>;
  page?: TablePage;
  loading?: boolean;
  radioKey?: string;
  hideSetting?: boolean;
  pageSize?: Array<number>;
  pageLayout?: string;
}

export type InTableProps = Partial<TableProps<any>> & ExtendTableProps;

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
  tooltipEffect: "dark",
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
  treeProps: () => TreeListKeyAndProps.props as any,
  tableLayout: "fixed" as any,
  scrollbarAlwaysOn: false,
  flexible: false,
  allowDragLastColumn: true,
  preserveExpandedContent: false,
  rowKey: TreeListKeyAndProps.key,
  expandRowKeys: undefined,
};
