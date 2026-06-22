import { newEnumExt } from "../common";

export enum AppTypeEnum {
  Platform = "0",
  Tenant = "1",
}

export const AppTypeEnumExtArray = [
  newEnumExt(AppTypeEnum.Platform, "平台", "danger"),
  newEnumExt(AppTypeEnum.Tenant, "租户", "success"),
];

export const useAppTypeEnum = () => {
  return useEnum(AppTypeEnumExtArray);
};

export enum AccessModeEnum {
  Open = "0",
  Permission = "1",
}

export const AccessModeEnumExtArray = [
  newEnumExt(AccessModeEnum.Open, "开放", "success"),
  newEnumExt(AccessModeEnum.Permission, "需权限", "warning"),
];

export const useAccessModeEnum = () => {
  return useEnum(AccessModeEnumExtArray);
};

export enum PermissionNodeTypeEnum {
  Group = "0",
  Navigation = "1",
  Action = "2",
}

export const PermissionNodeTypeEnumExtArray = [
  newEnumExt(PermissionNodeTypeEnum.Group, "分组", "info"),
  newEnumExt(PermissionNodeTypeEnum.Navigation, "导航", "warning"),
  newEnumExt(PermissionNodeTypeEnum.Action, "操作", "success"),
];

export const usePermissionNodeTypeEnum = () => {
  return useEnum(PermissionNodeTypeEnumExtArray);
};
