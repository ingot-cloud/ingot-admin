import { formatDateTime } from "@ingot/shared";
import { AuditReferenceType } from "../../models/iam/constants";
import type { AuditReferences } from "../../models/iam/types";
import { AUDIT_SINGLETON_TARGETS, referenceText, resolveReference } from "./references";

export const AUDIT_FIELD_LABELS: Record<string, string> = {
  NAME: "名称",
  REMARK: "备注",
  FIELD_CAPABILITIES: "字段能力",
  STATUS: "状态",
  ROLE_REVISION: "角色版本",
  ROLE: "角色",
  SCOPE: "范围",
  RECIPIENT_SELECTION: "接收对象",
  VALID_FROM: "生效时间",
  VALID_UNTIL: "失效时间",
  ENTITLEMENT: "应用开通",
  POLICY_VERSION: "策略版本",
  OWNER_MEMBER: "所有者",
  DEPARTMENT_LEADERS: "部门负责人",
};

export interface AuditChangeLine {
  field: string;
  label: string;
  before?: string;
  after?: string;
}

const STATUS_LABELS: Record<string, string> = {
  ENABLED: "启用",
  DISABLED: "停用",
  ACTIVE: "有效",
  REVOKED: "已撤销",
  LOCKED: "已锁定",
  REMOVED: "已移出",
  SUSPENDED: "暂停",
  NEW: "新建",
  PREFLIGHTED: "已预检",
  IMPORTED: "已导入",
  VERIFIED: "已验收",
  FAILED: "失败",
  PENDING: "待处理",
  RUNNING: "进行中",
  SUCCEEDED: "成功",
  EXPIRED: "已过期",
};

const RECIPIENT_PLACEHOLDERS = new Set(["created", "before", "after"]);
const UNPARSED = "无法解析的配置";
const EMPTY = "空";
const ABSENT = "（无）";

const textOf = (type: AuditReferenceType, id: string, references?: AuditReferences): string =>
  referenceText(type, resolveReference(references, type, id));

const parseJson = (value: string): unknown | undefined => {
  const trimmed = value.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return undefined;
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return undefined;
  }
};

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const asIdList = (value: unknown): string[] =>
  Array.isArray(value) ? value.map((item) => String(item)) : [];

const joinNames = (type: AuditReferenceType, ids: string[], references?: AuditReferences): string =>
  ids.length ? ids.map((id) => textOf(type, id, references)).join("、") : "";

const scalar = (value: string | null | undefined): string => {
  if (value === undefined || value === null) return ABSENT;
  if (value === "") return EMPTY;
  return value;
};

const formatStatus = (value: string): string => STATUS_LABELS[value] || value;

const formatLeaders = (value: string, references?: AuditReferences): string => {
  if (/^[1-9]\d*$/.test(value)) return textOf(AuditReferenceType.MEMBER, value, references);
  const parsed = parseJson(value);
  if (parsed === undefined) return UNPARSED;
  const record = asRecord(parsed);
  if (!record) return UNPARSED;
  const parts: string[] = [];
  const added = joinNames(AuditReferenceType.MEMBER, asIdList(record.addedMemberIds), references);
  const removed = joinNames(
    AuditReferenceType.MEMBER,
    asIdList(record.removedMemberIds),
    references,
  );
  const primary =
    record.primaryMemberId === null || record.primaryMemberId === undefined
      ? ""
      : textOf(AuditReferenceType.MEMBER, String(record.primaryMemberId), references);
  if (added) parts.push(`新增：${added}`);
  if (removed) parts.push(`移除：${removed}`);
  if (primary) parts.push(`主负责人：${primary}`);
  return parts.length ? parts.join("；") : "部门负责人无变化";
};

const formatSubject = (value: unknown, references?: AuditReferences): string | undefined => {
  const record = asRecord(value);
  if (!record || typeof record.type !== "string" || record.id === undefined) return undefined;
  const type =
    record.type === "GROUP" || record.type === "group"
      ? AuditReferenceType.GROUP
      : AuditReferenceType.MEMBER;
  return `${type === AuditReferenceType.GROUP ? "用户组" : "成员"} ${textOf(type, String(record.id), references)}`;
};

const formatRecipients = (value: string, references?: AuditReferences): string => {
  if (RECIPIENT_PLACEHOLDERS.has(value)) return "接收对象已调整（未记录明细）";
  const parsed = parseJson(value);
  if (parsed === undefined) return value;
  const subjects = Array.isArray(parsed) ? parsed : [parsed];
  const lines = subjects
    .map((item) => formatSubject(item, references))
    .filter((item): item is string => Boolean(item));
  if (lines.length) return lines.join("、");
  const record = asRecord(parsed);
  if (!record) return UNPARSED;
  const members = joinNames(AuditReferenceType.MEMBER, asIdList(record.members), references);
  const departments = Array.isArray(record.departments)
    ? record.departments
        .map((item) => asRecord(item)?.id)
        .filter((id): id is string | number => id !== undefined)
        .map((id) => textOf(AuditReferenceType.DEPARTMENT, String(id), references))
        .join("、")
    : "";
  const parts = [
    members ? `成员 ${members}` : "",
    departments ? `部门 ${departments}` : "",
  ].filter(Boolean);
  return parts.length ? parts.join("；") : UNPARSED;
};

const formatScope = (value: string, references: AuditReferences | undefined, detail: boolean): string => {
  const parsed = parseJson(value);
  const record = asRecord(parsed);
  if (!record) return parsed === undefined && !value.startsWith("{") ? value : UNPARSED;
  if ("administratorMemberId" in record || "resourceScopeCeilings" in record) {
    const admin = record.administratorMemberId
      ? textOf(AuditReferenceType.MEMBER, String(record.administratorMemberId), references)
      : "";
    const roles = asIdList(record.allowedRoleIds);
    if (!detail) {
      const count = roles.length;
      return `授权管理${admin ? `：${admin}` : ""}${count ? `，可授角色 ${count} 个` : ""}`;
    }
    return [
      admin ? `管理员：${admin}` : "",
      roles.length
        ? `可授角色：${joinNames(AuditReferenceType.ROLE, roles, references)}`
        : "",
      record.maxAssignmentDuration ? `最长期限：${record.maxAssignmentDuration}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }
  const flags = Object.entries(record).filter(([, flag]) => typeof flag === "boolean");
  if (flags.length && flags.length === Object.keys(record).length) {
    const names = flags.map(([id]) => textOf(AuditReferenceType.DEPARTMENT, id, references));
    if (!detail) return `任职部门 ${names.length} 个`;
    return names
      .map((name, index) => `${name}${flags[index][1] ? "（主部门）" : ""}`)
      .join("\n");
  }
  return detail ? value : "范围已调整";
};

const formatCapabilities = (value: string, detail: boolean): string => {
  const parsed = parseJson(value);
  if (!Array.isArray(parsed)) return parsed === undefined ? value : UNPARSED;
  if (!detail) return `字段能力配置（${parsed.length} 项）`;
  return parsed
    .map((item) => {
      const record = asRecord(item);
      return record && typeof record.name === "string" ? record.name : JSON.stringify(item);
    })
    .join("\n");
};

/** 把一个差异值格式化成可读文本。结构化内容解析失败时不抛错。 */
export const formatAuditValue = (
  field: string,
  value: string | null | undefined,
  references?: AuditReferences,
  detail = false,
): string => {
  if (value === undefined) return ABSENT;
  if (value === null) return "空值";
  if (value === "") return EMPTY;
  switch (field) {
    case "STATUS":
      return formatStatus(value);
    case "ROLE":
      return textOf(AuditReferenceType.ROLE, value, references);
    case "ROLE_REVISION":
      return textOf(AuditReferenceType.ROLE_REVISION, value, references);
    case "OWNER_MEMBER":
      return textOf(AuditReferenceType.MEMBER, value, references);
    case "DEPARTMENT_LEADERS":
      return formatLeaders(value, references);
    case "RECIPIENT_SELECTION":
      return formatRecipients(value, references);
    case "SCOPE":
      return formatScope(value, references, detail);
    case "VALID_FROM":
    case "VALID_UNTIL":
      return formatDateTime(value);
    case "ENTITLEMENT":
      return `已开通 ${value} 个应用`;
    case "POLICY_VERSION":
      return `第 ${value} 版`;
    case "FIELD_CAPABILITIES":
      return formatCapabilities(value, detail);
    case "NAME":
    case "REMARK":
      return value;
    default:
      return value;
  }
};

const omitField = (field: string, value: string | null | undefined, targetType?: string): boolean =>
  field === "NAME" &&
  !!targetType &&
  AUDIT_SINGLETON_TARGETS.has(targetType) &&
  value === targetType;

/** 一条审计的全部差异；创建只保留新值，移除只保留原值，两侧都空的字段略去。 */
export const auditChangeLines = (
  before: Record<string, string | null>,
  after: Record<string, string | null>,
  references?: AuditReferences,
  targetType?: string,
  detail = false,
): AuditChangeLine[] => {
  const fields = [...new Set([...Object.keys(before), ...Object.keys(after)])];
  return fields.flatMap((field) => {
    const rawBefore = before[field];
    const rawAfter = after[field];
    if (omitField(field, rawBefore, targetType) && omitField(field, rawAfter, targetType)) {
      return [];
    }
    const hasBefore = rawBefore !== undefined && !omitField(field, rawBefore, targetType);
    const hasAfter = rawAfter !== undefined && !omitField(field, rawAfter, targetType);
    if (!hasBefore && !hasAfter) return [];
    return [
      {
        field,
        label: AUDIT_FIELD_LABELS[field] || field,
        before: hasBefore ? formatAuditValue(field, rawBefore, references, detail) : undefined,
        after: hasAfter ? formatAuditValue(field, rawAfter, references, detail) : undefined,
      },
    ];
  });
};

export const formatChangeLine = (line: AuditChangeLine): string => {
  if (line.before !== undefined && line.after !== undefined) {
    return `${line.label}：${line.before} → ${line.after}`;
  }
  if (line.after !== undefined) return `${line.label}：（无） → ${line.after}`;
  return `${line.label}：${scalar(line.before)} → （无）`;
};
