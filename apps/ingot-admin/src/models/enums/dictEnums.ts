import { newEnumExt } from "../common";

/**
 * 字典节点类型
 */
export enum DictType {
  // 字典类型（分组节点）
  Type = "0",
  // 字典项（实际枚举值）
  Item = "1",
}
export const DictTypeEnumExtArray = [
  newEnumExt(DictType.Type, "字典类型", "primary"),
  newEnumExt(DictType.Item, "字典项", "success"),
];
export const useDictTypeEnum = () => {
  return useEnum(DictTypeEnumExtArray);
};

/**
 * 字典作用域
 */
export enum DictScope {
  // 平台共享
  Platform = "0",
  // 租户隔离
  Tenant = "1",
  // 应用隔离
  App = "2",
}
export const DictScopeEnumExtArray = [
  newEnumExt(DictScope.Platform, "平台", "primary"),
  newEnumExt(DictScope.Tenant, "租户", "warning"),
  newEnumExt(DictScope.App, "应用", "info"),
];
export const useDictScopeEnum = () => {
  return useEnum(DictScopeEnumExtArray);
};
