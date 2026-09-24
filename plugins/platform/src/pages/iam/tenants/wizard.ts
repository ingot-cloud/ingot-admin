import {
  ConfigurationStatus,
  EntitlementSource,
  type EntitlementDraft,
  type EntitlementPreviewItem,
  type EntitlementRecord,
} from "@ingot/admin-common";

export const TENANT_AVATAR_DIR = "tenant/avatar";

export const CREATE_WIZARD_STEPS = [
  { title: "组织资料", description: "设置组织名称和头像" },
  { title: "所有者", description: "指定已有全局账号" },
  { title: "开通", description: "选择套餐与自选应用" },
  { title: "预览", description: "确认后提交创建" },
] as const;

export const ENTITLEMENT_WIZARD_STEPS = [
  { title: "开通环境", description: "选择套餐与自选应用并设期限" },
  { title: "预览", description: "预览开通影响后保存" },
] as const;

export interface EntitlementItem {
  applicationId: string;
  applicationName: string;
  status: ConfigurationStatus;
  validFrom?: string;
  validUntil?: string;
  source?: string;
  sourceId?: string;
}

export function formatDateTime(value?: string): string {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  const pad = (n: number): string => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatValidity(_from?: string, until?: string): string {
  return until ? formatDateTime(until) : "无限使用";
}

export function ownerContactOf(record: { ownerPhone?: string; ownerEmail?: string }): string {
  return record.ownerPhone || record.ownerEmail || "-";
}

export function toEntitlementItems(records: EntitlementRecord[]): EntitlementItem[] {
  return records.map((item) => ({
    applicationId: item.applicationId,
    applicationName: item.applicationName || item.applicationId,
    status: item.status,
    validFrom: item.validFrom,
    validUntil: item.validUntil,
    source: item.source,
    sourceId: item.sourceId,
  }));
}

export function toPreviewItems(items?: EntitlementPreviewItem[]): EntitlementItem[] {
  return (items ?? []).map((item) => ({
    applicationId: item.applicationId,
    applicationName: item.applicationName || item.applicationId,
    status: item.status,
    validFrom: item.validFrom,
    validUntil: item.validUntil,
    source: item.source,
    sourceId: item.sourceId,
  }));
}

export function toEntitlementDrafts(items: EntitlementItem[]): EntitlementDraft[] {
  return items.map((item) => ({
    applicationId: item.applicationId,
    status: item.status,
    validFrom: item.validFrom || undefined,
    validUntil: item.validUntil || undefined,
  }));
}

export function extraDraftsOf(items: EntitlementItem[], extraIds: string[]): EntitlementDraft[] {
  const byId = new Map(items.map((item) => [item.applicationId, item]));
  return extraIds.map((id) => {
    const item = byId.get(id);
    return {
      applicationId: id,
      status: ConfigurationStatus.ENABLED,
      validUntil: item?.validUntil || undefined,
    };
  });
}

export function extraSelectOptionsOf(items: EntitlementItem[]): Array<{ id: string; name: string }> {
  return items.filter(isRemovableEntitlement).map((item) => ({
    id: item.applicationId,
    name: item.applicationName,
  }));
}

export function extraIdsForResolve(
  items: EntitlementItem[],
  extraIds: string[],
  previous: EntitlementDraft[],
): string[] {
  const ids = new Set(extraIds);
  const previousById = new Map(previous.map((item) => [item.applicationId, item]));
  for (const item of items) {
    const before = previousById.get(item.applicationId);
    if (before && (before.validUntil || undefined) !== (item.validUntil || undefined)) {
      ids.add(item.applicationId);
    }
  }
  return [...ids];
}

export function isRemovableEntitlement(item: EntitlementItem): boolean {
  return item.source === EntitlementSource.MANUAL;
}

export function isLockedEntitlement(item: EntitlementItem): boolean {
  return item.source === EntitlementSource.INITIALIZATION || item.source === EntitlementSource.PLAN;
}

export function emptyEntitlement(applicationId: string, applicationName: string): EntitlementItem {
  return {
    applicationId,
    applicationName,
    status: ConfigurationStatus.ENABLED,
    source: EntitlementSource.MANUAL,
  };
}
