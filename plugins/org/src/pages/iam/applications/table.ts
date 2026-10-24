import {
  IamAction,
  objectActionAllowed,
  type EntitlementRecord,
  type ResourceDetail,
} from "@ingot/admin-common";

export type Row = ResourceDetail<EntitlementRecord>;

export const APPLICATION_GRID_PAGE_SIZES = [20, 30, 40, 50];

export function detailAccess(row: Row): { allowed: boolean; message?: string } {
  return objectActionAllowed(row.capabilities, IamAction.TENANT_APPLICATION_READ);
}

export function applicationLabel(row: Row): string {
  return row.record.applicationName || row.record.applicationId;
}
