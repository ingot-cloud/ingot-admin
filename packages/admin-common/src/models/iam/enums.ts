import { newEnumExt, useEnum } from "@ingot/admin-core";
import {
  AccountLookupPurpose,
  AudienceKind,
  ConfigurationStatus,
  DefaultPolicyKind,
  DirectoryDefaultScope,
  ExportTaskStatus,
  FieldVisibility,
  MemberStatus,
  MenuAccessMode,
  MenuKind,
  MenuMatchMode,
  PolicyEffect,
  PolicyScenario,
  RoleKind,
  AuthorizationDomain,
  SelectionPurpose,
  ScopeKind,
  RoleDeltaOperation,
  SubjectType,
  ScopeBindingKind,
  UpgradeResolutionChoice,
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

export const ScopeKindExtArray = [
  newEnumExt(ScopeKind.ALL, "全部"),
  newEnumExt(ScopeKind.SELF, "本人"),
  newEnumExt(ScopeKind.MEMBER_DEPARTMENTS, "所在部门"),
  newEnumExt(ScopeKind.MANAGED_DEPARTMENTS, "管理部门"),
  newEnumExt(ScopeKind.OBJECT_SET, "指定对象"),
];

export const useScopeKindEnum = () => useEnum(ScopeKindExtArray);

export const RoleDeltaOperationExtArray = [
  newEnumExt(RoleDeltaOperation.ADD, "新增", "success"),
  newEnumExt(RoleDeltaOperation.REMOVE, "移除", "danger"),
  newEnumExt(RoleDeltaOperation.REPLACE_SCOPE, "替换范围", "warning"),
];

export const useRoleDeltaOperationEnum = () => useEnum(RoleDeltaOperationExtArray);

export const SubjectTypeExtArray = [
  newEnumExt(SubjectType.MEMBER, "成员"),
  newEnumExt(SubjectType.GROUP, "用户组"),
];

export const useSubjectTypeEnum = () => useEnum(SubjectTypeExtArray);

export const ScopeBindingKindExtArray = [
  newEnumExt(ScopeBindingKind.DEPARTMENTS, "部门集合"),
  newEnumExt(ScopeBindingKind.OBJECTS, "对象集合"),
];

export const useScopeBindingKindEnum = () => useEnum(ScopeBindingKindExtArray);

export const UpgradeResolutionChoiceExtArray = [
  newEnumExt(UpgradeResolutionChoice.ACCEPT_BASE, "采用新基础"),
  newEnumExt(UpgradeResolutionChoice.KEEP_DELTA, "保留差异"),
  newEnumExt(UpgradeResolutionChoice.REPLACE_SCOPE, "替换范围"),
];

export const useUpgradeResolutionChoiceEnum = () => useEnum(UpgradeResolutionChoiceExtArray);

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

export const AudienceKindExtArray = [
  newEnumExt(AudienceKind.ALL, "全组织"),
  newEnumExt(AudienceKind.SELECTED, "指定人群"),
];

export const useAudienceKindEnum = () => useEnum(AudienceKindExtArray);

export const PolicyEffectExtArray = [
  newEnumExt(PolicyEffect.ALLOW, "允许", "success"),
  newEnumExt(PolicyEffect.DENY, "禁止", "danger"),
];

export const usePolicyEffectEnum = () => useEnum(PolicyEffectExtArray);

export const DirectoryDefaultScopeExtArray = [
  newEnumExt(DirectoryDefaultScope.ALL, "全部"),
  newEnumExt(DirectoryDefaultScope.SELF, "本人"),
  newEnumExt(DirectoryDefaultScope.SELECTED, "指定范围"),
];

export const useDirectoryDefaultScopeEnum = () => useEnum(DirectoryDefaultScopeExtArray);

export const PolicyScenarioExtArray = [
  newEnumExt(PolicyScenario.MANAGEMENT, "后台管理"),
  newEnumExt(PolicyScenario.DIRECTORY, "普通通讯录"),
];

export const usePolicyScenarioEnum = () => useEnum(PolicyScenarioExtArray);

export const DefaultPolicyKindExtArray = [
  newEnumExt(DefaultPolicyKind.DIRECTORY, "通讯录"),
  newEnumExt(DefaultPolicyKind.FIELD, "字段"),
];

export const useDefaultPolicyKindEnum = () => useEnum(DefaultPolicyKindExtArray);

export const ExportTaskStatusExtArray = [
  newEnumExt(ExportTaskStatus.PENDING, "排队中", "info"),
  newEnumExt(ExportTaskStatus.RUNNING, "导出中", "warning"),
  newEnumExt(ExportTaskStatus.SUCCEEDED, "已完成", "success"),
  newEnumExt(ExportTaskStatus.FAILED, "失败", "danger"),
  newEnumExt(ExportTaskStatus.EXPIRED, "已过期", "info"),
];

export const useExportTaskStatusEnum = () => useEnum(ExportTaskStatusExtArray);
