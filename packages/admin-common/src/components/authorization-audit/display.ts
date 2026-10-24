import { AuditChangeType, AuthorizationDomain, IamAction } from "../../models/iam/constants";
import type { AuditEntry, AuditReferences } from "../../models/iam/types";
import { auditChangeLines, formatChangeLine } from "./formatters";
import { referenceText, referenceTypeOfTarget, resolveReference } from "./references";

export { AUDIT_FIELD_LABELS } from "./formatters";

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
  "directory-policy": "目录策略",
  "field-policy": "字段策略",
  "member-export": "成员导出",
  "member-workbook": "成员导入",
  "department-workbook": "部门导入",
};

export const TENANT_AUDIT_TARGETS = [
  "member",
  "department",
  "group",
  "role",
  "assignment",
  "delegation",
  "application",
  "entitlement",
  "audience",
  "directory-policy",
  "field-policy",
  "member-export",
  "member-workbook",
  "department-workbook",
  "ROLE_VERSION_APPLICATION",
];

export const PLATFORM_AUDIT_TARGETS = [
  "account",
  "member",
  "group",
  "role",
  "assignment",
  "delegation",
  "application",
  "tenant",
  "resource",
  "action",
  "menu",
  "plan",
];

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

export const auditActor = (entry: AuditEntry, references?: AuditReferences): string =>
  referenceText("member", resolveReference(references, "member", entry.actor.memberId));

export const auditTarget = (entry: AuditEntry, references?: AuditReferences): string => {
  const label = AUDIT_RESOURCE_LABELS[entry.target.resource] || entry.target.resource;
  const type = referenceTypeOfTarget(entry.target.resource);
  if (!type) return label;
  return `${label} · ${referenceText(type, resolveReference(references, type, entry.target.id))}`;
};

export const auditChange = (entry: AuditEntry): string =>
  AUDIT_CHANGE_LABELS[entry.changeType] || entry.changeType;

export const auditSummary = (entry: AuditEntry, references?: AuditReferences): string => {
  const lines = auditChangeLines(entry.before, entry.after, references, entry.target.resource);
  return lines.length ? lines.map(formatChangeLine).join("；") : "无配置差异";
};

export const auditSummaryLines = (entry: AuditEntry, references?: AuditReferences): string => {
  const lines = auditChangeLines(
    entry.before,
    entry.after,
    references,
    entry.target.resource,
    true,
  );
  return lines.length ? lines.map(formatChangeLine).join("\n") : "无配置差异";
};
