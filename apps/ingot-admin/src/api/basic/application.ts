import Http from "@/net";
import type {
  R,
  Page,
  SysApplication,
  ApplicationPageItemVO,
  ApplicationOrgPageItemVO,
  ApplicationFilterDTO,
  SysApplicationTenant,
} from "@/models";
import { filterParams } from "@/utils/object";

export function ApplicationPageAPI(
  page: Page,
  condition?: ApplicationFilterDTO,
): Promise<R<Page<ApplicationPageItemVO>>> {
  if (condition) {
    filterParams(condition);
  }
  return Http.get<Page<ApplicationPageItemVO>>("/api/pms/v1/admin/application/page", {
    ...page,
    ...condition,
  });
}

export function OrgApplicationAPI(orgId: string): Promise<R<Array<ApplicationOrgPageItemVO>>> {
  return Http.get<Array<ApplicationOrgPageItemVO>>(`/api/pms/v1/admin/application/page/${orgId}`);
}

export function SyncApplication(id: string) {
  return Http.put<void>(`/api/pms/v1/admin/application/sync/${id}`);
}

export function CreateAppAPI(params: SysApplication) {
  return Http.post<void>("/api/pms/v1/admin/application", params);
}

export function RemoveAppAPI(id: string) {
  return Http.delete<void>(`/api/pms/v1/admin/application/${id}`, null);
}

export function UpdateAppStatusAPI(params: SysApplication) {
  return Http.put<void>("/api/pms/v1/admin/application/status", params);
}

export function UpdateAppDefaultAPI(params: SysApplication) {
  return Http.put<void>("/api/pms/v1/admin/application/default", params);
}

export function UpdateOrgAppStatusAPI(orgId: string, params: SysApplicationTenant) {
  return Http.put<void>(`/api/pms/v1/admin/application/status/org/${orgId}`, params);
}
