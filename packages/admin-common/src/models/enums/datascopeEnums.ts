import { newEnumExt, useEnum } from "@ingot/admin-core";

export enum DataScopeTypeEnum {
  ALL = 0,
  CUSTOM = 1,
  DEPT_AND_CHILD = 2,
  DEPT = 3,
  SELF = 9,
}

export const DataScopeTypeEnumExtArray = [
  newEnumExt(DataScopeTypeEnum.ALL, "全部", "info"),
  newEnumExt(DataScopeTypeEnum.CUSTOM, "指定部门", "info"),
  newEnumExt(DataScopeTypeEnum.DEPT_AND_CHILD, "本部门及下级", "info"),
  newEnumExt(DataScopeTypeEnum.DEPT, "本部门", "info"),
  newEnumExt(DataScopeTypeEnum.SELF, "仅本人", "info"),
];

export const useDataScopeTypeEnum = () => {
  return useEnum(DataScopeTypeEnumExtArray);
};
