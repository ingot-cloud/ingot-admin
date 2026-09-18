import { newEnumExt, useEnum } from "@ingot/admin-core";
import {
  AccountLookupPurpose,
  ConfigurationStatus,
  FieldVisibility,
  MemberStatus,
  MenuAccessMode,
  MenuKind,
  MenuMatchMode,
  RoleKind,
  AuthorizationDomain,
  SelectionPurpose,
} from "./constants";

export const ConfigurationStatusExtArray = [
  newEnumExt(ConfigurationStatus.ENABLED, "启用", "success", ConfigurationStatus.DISABLED),
  newEnumExt(ConfigurationStatus.DISABLED, "停用", "danger", ConfigurationStatus.ENABLED),
];

export const useConfigurationStatusEnum = () => useEnum(ConfigurationStatusExtArray);

export const MemberStatusExtArray = [
  newEnumExt(MemberStatus.ACTIVE, "在职", "success"),
  newEnumExt(MemberStatus.SUSPENDED, "已暂停", "warning"),
  newEnumExt(MemberStatus.REMOVED, "已移出", "info"),
];

export const useMemberStatusEnum = () => useEnum(MemberStatusExtArray);

export const FieldVisibilityExtArray = [
  newEnumExt(FieldVisibility.HIDDEN, "隐藏", "info"),
  newEnumExt(FieldVisibility.MASKED, "脱敏", "warning"),
  newEnumExt(FieldVisibility.FULL, "完整", "success"),
];

export const useFieldVisibilityEnum = () => useEnum(FieldVisibilityExtArray);

export const RoleKindExtArray = [
  newEnumExt(RoleKind.SYSTEM, "系统", "danger"),
  newEnumExt(RoleKind.SHARED, "共享", "warning"),
  newEnumExt(RoleKind.PLATFORM_CUSTOM, "平台自定义", "success"),
  newEnumExt(RoleKind.TENANT_CUSTOM, "组织自定义", "success"),
];

export const useRoleKindEnum = () => useEnum(RoleKindExtArray);

export const AuthorizationDomainExtArray = [
  newEnumExt(AuthorizationDomain.PLATFORM, "平台", "danger"),
  newEnumExt(AuthorizationDomain.TENANT, "组织", "success"),
];

export const useAuthorizationDomainEnum = () => useEnum(AuthorizationDomainExtArray);

export const AccountLookupPurposeExtArray = [
  newEnumExt(AccountLookupPurpose.ACCOUNT_MANAGE, "账号治理"),
  newEnumExt(AccountLookupPurpose.MEMBER_CREATE, "添加成员"),
];

export const useAccountLookupPurposeEnum = () => useEnum(AccountLookupPurposeExtArray);

export const SelectionPurposeExtArray = [
  newEnumExt(SelectionPurpose.ASSIGN_RECIPIENT, "授权对象"),
  newEnumExt(SelectionPurpose.MANAGED_DEPARTMENT, "管理部门"),
  newEnumExt(SelectionPurpose.DIRECTORY, "通讯录"),
];

export const useSelectionPurposeEnum = () => useEnum(SelectionPurposeExtArray);

export const MenuKindExtArray = [
  newEnumExt(MenuKind.DIRECTORY, "目录"),
  newEnumExt(MenuKind.PAGE, "页面"),
];

export const useMenuKindEnum = () => useEnum(MenuKindExtArray);

export const MenuAccessModeExtArray = [
  newEnumExt(MenuAccessMode.OPEN, "开放"),
  newEnumExt(MenuAccessMode.ACTION, "按操作"),
];

export const useMenuAccessModeEnum = () => useEnum(MenuAccessModeExtArray);

export const MenuMatchModeExtArray = [
  newEnumExt(MenuMatchMode.ANY, "任一操作"),
  newEnumExt(MenuMatchMode.ALL, "全部操作"),
];

export const useMenuMatchModeEnum = () => useEnum(MenuMatchModeExtArray);
