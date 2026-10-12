import { AuditChangeType, AuthorizationDomain, IamAction, type AuditEntry } from "../../models/iam";

export const AUDIT_FIELD_LABELS: Record<string, string> = {
  NAME: "名称",
  REMARK: "备注",
  FIELD_CAPABILITIES: "字段能力",
  STATUS: "状态",
  ROLE_REVISION: "角色版本",
  SCOPE: "范围",
  RECIPIENT_SELECTION: "接收对象",
  VALID_FROM: "生效时间",
  VALID_UNTIL: "失效时间",
  ENTITLEMENT: "应用开通",
  POLICY_VERSION: "策略版本",
  OWNER_MEMBER: "所有者",
};
export const AUDIT_RESOURCE_LABELS: Record<string, string> = {
  account: "账号",
  member: "成员",
  department: "部门",
  group: "用户组",
  role: "角色",
  assignment: "角色分配",
  delegation: "授权管理员",
  application: "应用",
  resource: "资源",
  action: "操作",
  menu: "菜单",
  tenant: "组织",
  entitlement: "应用开通",
  audience: "应用人群",
  plan: "套餐",
  ROLE_VERSION_APPLICATION: "版本应用任务",
};
export const AUDIT_CHANGE_LABELS: Record<AuditChangeType, string> = {
  [AuditChangeType.CREATE]: "创建",
  [AuditChangeType.UPDATE]: "修改",
  [AuditChangeType.ENABLE]: "启用",
  [AuditChangeType.DISABLE]: "停用",
  [AuditChangeType.REMOVE]: "移出",
  [AuditChangeType.REVOKE]: "撤销",
  [AuditChangeType.PUBLISH]: "发布版本",
  [AuditChangeType.UPGRADE]: "升级版本",
  [AuditChangeType.OWNER_TRANSFER]: "转交所有者",
};
export const auditReadAction = (domain?: string): string | undefined =>
  domain === AuthorizationDomain.PLATFORM
    ? IamAction.PLATFORM_AUDIT_READ
    : domain === AuthorizationDomain.TENANT
      ? IamAction.TENANT_AUDIT_READ
      : undefined;
export const auditActor = (entry: AuditEntry): string =>
  entry.actor.displayName || `成员 ${entry.actor.memberId}`;
export const auditTarget = (entry: AuditEntry): string =>
  `${AUDIT_RESOURCE_LABELS[entry.target.resource] || entry.target.resource} · ${entry.target.id}`;
export const auditChange = (entry: AuditEntry): string =>
  AUDIT_CHANGE_LABELS[entry.changeType] || entry.changeType;
export const auditSummary = (entry: AuditEntry): string => {
  const fields = [...new Set([...Object.keys(entry.before), ...Object.keys(entry.after)])];
  return fields.length
    ? `涉及 ${fields.map((key) => AUDIT_FIELD_LABELS[key] || key).join("、")}`
    : "无配置差异";
};
export const auditValue = (value: string | null | undefined): string =>
  value === undefined ? "未记录" : value === null ? "空值" : value === "" ? "空文本" : value;
