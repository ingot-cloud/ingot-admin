import { CommonStatus, DictType, DictScope } from "./enums";

// ============== 类型别名 ==============
export type { DictType, DictScope };

/**
 * 业务自定义组织类型，默认 '0'
 */
export type OrgType = string;

// ============== 文案映射 ==============

export const DictTypeText: Record<DictType, string> = {
  [DictType.Type]: "字典类型",
  [DictType.Item]: "字典项",
};

export const DictScopeText: Record<DictScope, string> = {
  [DictScope.Platform]: "平台",
  [DictScope.Tenant]: "租户",
  [DictScope.App]: "应用",
};

export const StatusText: Record<CommonStatus, string> = {
  [CommonStatus.Enable]: "启用",
  [CommonStatus.Lock]: "禁用",
};

// ============== 数据模型 ==============

/**
 * 平台字典实体（管理端分页接口返回）
 */
export interface PlatformDict {
  // 雪花 ID
  id?: string;
  // 父 ID；TYPE 节点为 null
  pid?: string | null;
  // 字典编码（业务唯一键）
  code?: string;
  // 名称
  name?: string;
  // 字典项值（仅 ITEM 有效）
  value?: string | null;
  // 字典项展示文本（仅 ITEM 有效）
  label?: string | null;
  type?: DictType;
  scopeType?: DictScope;
  // scopeType='1' 必填
  tenantId?: string | null;
  // scopeType='2' 必填
  appId?: string | null;
  orgType?: OrgType | null;
  sort?: number;
  // 内置字典：true 时禁止改 code/value、禁止删除
  systemFlag?: boolean;
  status?: CommonStatus;
  remark?: string | null;
  // 扩展字段：icon / color / i18n 等
  extra?: Record<string, unknown> | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  // yyyy-MM-dd HH:mm:ss
  createdAt?: string;
  updatedAt?: string;
  // 通常为 null
  deletedAt?: string | null;
}

/**
 * 字典项 VO（items / inner 接口返回）
 */
export interface DictItemVO {
  id?: string;
  pid?: string | null;
  code?: string;
  name?: string;
  value?: string | null;
  label?: string | null;
  type?: DictType;
  scopeType?: DictScope;
  tenantId?: string | null;
  appId?: string | null;
  orgType?: OrgType | null;
  sort?: number | null;
  systemFlag?: boolean | null;
  status?: CommonStatus | null;
  remark?: string | null;
  extra?: Record<string, unknown> | null;
}

/**
 * 字典树节点（tree 接口返回）
 */
export interface DictTreeNodeVO extends Omit<DictItemVO, "systemFlag" | "status"> {
  systemFlag?: boolean | null;
  status?: CommonStatus | null;
  // 后端 TreeUtil 构建，可能为空数组
  children?: Array<DictTreeNodeVO>;
}

// ============== 请求 DTO ==============

/**
 * 查询条件（树 / 分页 / 字典项 共用）
 */
export interface DictQueryDTO {
  // 字典编码（精确匹配）
  code?: string;
  // 名称（前缀匹配）
  keyword?: string;
  // 节点类型
  type?: DictType;
  // 缺省按平台
  scopeType?: DictScope;
  // scopeType='1' 时必填
  tenantId?: string;
  // scopeType='2' 时必填
  appId?: string;
  orgType?: OrgType;
  // 管理端可显式查禁用项
  status?: CommonStatus;
}

/**
 * 新建载荷
 */
export interface DictCreateDTO {
  // 必填
  code?: string;
  name?: string;
  type?: DictType;
  scopeType?: DictScope;
  // 其他可选字段
  pid?: string | null;
  tenantId?: string | null;
  appId?: string | null;
  value?: string | null;
  label?: string | null;
  sort?: number;
  status?: CommonStatus;
  systemFlag?: boolean;
  remark?: string | null;
  extra?: Record<string, unknown> | null;
  orgType?: OrgType | null;
}

/**
 * 更新载荷（必须带 id）
 */
export interface DictUpdateDTO extends Partial<PlatformDict> {
  id: string;
}

/**
 * 排序载荷
 */
export interface DictSortDTO {
  id: string;
  sort: number;
}
