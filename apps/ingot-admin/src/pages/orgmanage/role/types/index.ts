import type { Ref } from "vue";
import type { TableHeaderRecord } from "@/components/table";
import type {
  PageChangeParams,
  RoleBindParams,
  R,
  OptionIDEntity,
  RoleGroupItemVO,
} from "@/models";

export type Apply<T, R> = (t: T) => R;
export type Apply2<T, T2, R> = (t: T, t2: T2) => R;
export type Consumer<T> = Apply<T, void>;
export type Runnable = () => void;
export interface FilterRecord {
  key: string;
  title: string;
  placeholder: string;
}
export type ConfirmMessageFn<T> = Apply<T, string>;
export type FetchDataFn<T> = (id: string, isBind: boolean, condition?: T) => Promise<R<Array<T>>>;
export type BindFn = Apply<RoleBindParams, Promise<R<void>>>;
export type DoFetchData = Apply<PageChangeParams | boolean, void>;

export interface BindSetupParams<T extends OptionIDEntity> {
  tableHeaders: Array<TableHeaderRecord>;
  singleConfirmMessage: ConfirmMessageFn<T>;
  batchConfirmMessage: string;
  fetchData: FetchDataFn<T>;
  bind: BindFn;
  emit?: any;
}

export interface BindSetupReturn<T> {
  bindTable: Ref;
  bindView: Ref;
  editBatch: Ref<boolean>;
  headers: Ref;
  records: any;
  selectData: Ref;
  queryCondition: any;
  fetchData: Apply<string, void>;
  handleUnbind: Apply2<string, T, void>;
  handleBatchUnbind: Apply<string, void>;
  cancelEditBatch: Runnable;
  onSelectChanged: Consumer<Array<any>>;
  showBindMoreView: Apply<RoleGroupItemVO, void>;
}

export interface UnbindSetupReturn<T> {
  isShow: Ref;
  node: Ref<RoleGroupItemVO>;
  bindTable: Ref;
  editBatch: Ref<boolean>;
  headers: Ref;
  records: any;
  selectData: Ref;
  queryCondition: any;
  fetchData: Runnable;
  handleBind: Apply<T, void>;
  handleBatchBind: Runnable;
  cancelEditBatch: Runnable;
  onSelectChanged: Consumer<Array<any>>;
  show: Apply<RoleGroupItemVO, void>;
}
