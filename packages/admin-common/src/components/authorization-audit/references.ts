import { AuditReferenceState, AuditReferenceType } from "../../models/iam/constants";
import type { AuditReferences } from "../../models/iam/types";

/** 不解析名称的单例或任务目标，列表只显示类型文案。 */
export const AUDIT_SINGLETON_TARGETS = new Set([
  "directory-policy",
  "field-policy",
  "member-export",
  "member-workbook",
  "department-workbook",
]);

const TYPE_LABELS: Record<string, string> = {
  [AuditReferenceType.MEMBER]: "成员",
  [AuditReferenceType.DEPARTMENT]: "部门",
  [AuditReferenceType.GROUP]: "用户组",
  [AuditReferenceType.ROLE]: "角色",
  [AuditReferenceType.ROLE_REVISION]: "角色版本",
  [AuditReferenceType.ASSIGNMENT]: "角色分配",
  [AuditReferenceType.DELEGATION]: "授权管理员",
  [AuditReferenceType.TENANT]: "组织",
  [AuditReferenceType.ACCOUNT]: "账号",
  [AuditReferenceType.APPLICATION]: "应用",
  [AuditReferenceType.ROLE_APPLICATION_TASK]: "版本应用任务",
};

/** 审计目标类型对应的引用类型；单例目标没有引用。 */
export const referenceTypeOfTarget = (resource: string): AuditReferenceType | undefined => {
  if (AUDIT_SINGLETON_TARGETS.has(resource)) return undefined;
  if (resource === "entitlement") return AuditReferenceType.TENANT;
  if (resource === "audience") return AuditReferenceType.APPLICATION;
  if (resource === "ROLE_VERSION_APPLICATION") return AuditReferenceType.ROLE_APPLICATION_TASK;
  return (Object.values(AuditReferenceType) as string[]).includes(resource)
    ? (resource as AuditReferenceType)
    : undefined;
};

export const referenceKey = (type: string, id: string): string => `${type}:${id}`;

export interface ResolvedReference {
  state: AuditReferenceState;
  name?: string;
}

/** 找不到引用时按无权查看处理，不回退成 ID。 */
export const resolveReference = (
  references: AuditReferences | undefined,
  type: string,
  id: string,
): ResolvedReference => {
  const found = references?.[referenceKey(type, id)];
  if (!found) return { state: AuditReferenceState.HIDDEN };
  return { state: found.state, name: found.name };
};

export const referenceTypeLabel = (type: string): string => TYPE_LABELS[type] || "对象";

/** 按披露状态生成可读名称。 */
export const referenceText = (type: string, reference: ResolvedReference): string => {
  const label = referenceTypeLabel(type);
  if (reference.state === AuditReferenceState.VISIBLE) return reference.name || `未命名${label}`;
  if (reference.state === AuditReferenceState.DELETED) {
    return reference.name ? `${reference.name}（已删除）` : `已删除的${label}`;
  }
  return `无权查看的${label}`;
};
