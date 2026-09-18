import type { Page } from "@ingot/admin-core";
import { IAM_MASKED_PLACEHOLDER, FieldVisibility } from "./constants";
import type { FieldAccessMap, IamPageResponse } from "./types";

export function isMaskedValue(value: unknown): boolean {
  return value === IAM_MASKED_PLACEHOLDER;
}

export function isFieldVisible(access: FieldAccessMap | undefined, key: string): boolean {
  const item = access?.[key];
  if (!item) {
    return true;
  }
  return item.visibility !== FieldVisibility.HIDDEN;
}

export function isFieldEditable(access: FieldAccessMap | undefined, key: string): boolean {
  const item = access?.[key];
  return item?.visibility === FieldVisibility.FULL && item.editable === true;
}

export function editablePatch<T extends object>(
  draft: T,
  access: FieldAccessMap | undefined,
  editedKeys: ReadonlyArray<keyof T & string>,
): Partial<T> {
  const patch: Partial<T> = {};
  for (const key of editedKeys) {
    if (!isFieldEditable(access, key)) {
      continue;
    }
    const value = draft[key];
    if (isMaskedValue(value)) {
      continue;
    }
    patch[key] = value;
  }
  return patch;
}

export function toIamListParams(
  page: Page,
  condition?: object,
): Record<string, unknown> {
  return {
    page: page.current ?? 1,
    pageSize: page.size ?? 20,
    ...condition,
  };
}

export function mapIamPage<T>(data: IamPageResponse<T> | undefined | null): Page<T> {
  return {
    current: data?.page ?? 1,
    size: data?.pageSize ?? 20,
    total: data?.total ?? 0,
    records: data?.items ?? [],
  };
}

export function emptySelectionDepartments(): [] {
  return [];
}

export function objectActionAllowed(
  capabilities: Record<string, { allowed?: boolean; message?: string }> | undefined,
  actionCode: string,
): { allowed: boolean; message?: string } {
  const item = capabilities?.[actionCode];
  return {
    allowed: item?.allowed === true,
    message: item?.message,
  };
}
