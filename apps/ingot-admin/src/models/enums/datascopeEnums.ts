import { newEnumExt } from "../common";

export enum DataScopeTypeEnum {
  ALL = 0,
  CUSTOM = 1,
  DEPT_AND_CHILD = 2,
  DEPT = 3,
  SELF = 9,
}
export const DataScopeTypeEnumExtArray = [
  newEnumExt(DataScopeTypeEnum.ALL, "全部数据权限", "info"),
  newEnumExt(DataScopeTypeEnum.CUSTOM, "自定义数据权限", "info"),
  newEnumExt(DataScopeTypeEnum.DEPT_AND_CHILD, "本部门及以下数据权限", "info"),
  newEnumExt(DataScopeTypeEnum.DEPT, "本部门数据权限", "info"),
  newEnumExt(DataScopeTypeEnum.SELF, "仅本人数据权限", "info"),
];
export const useDataScopeTypeEnum = () => {
  return useEnum(DataScopeTypeEnumExtArray);
};
