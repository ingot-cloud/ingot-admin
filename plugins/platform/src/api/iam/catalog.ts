import { filterParams, request, type RequestOptions } from "@ingot/admin-core";
import type { Page, R } from "@ingot/admin-core";
import {
  IAM_API_PREFIX,
  mapIamPage,
  toIamListParams,
  type AppActionDraft,
  type AppActionRecord,
  type AppActionUpdateInput,
  type AppMenuDraft,
  type AppMenuRecord,
  type AppMenuUpdateInput,
  type AppResourceDraft,
  type AppResourceRecord,
  type AppResourceUpdateInput,
  type ApplicationDraft,
  type ApplicationRecord,
  type ApplicationUpdateInput,
  type ConfigurationStatusInput,
  type CreatedResource,
  type IamListQuery,
  type IamPageResponse,
  type PlanDraft,
  type PlanRecord,
  type PlanUpdateInput,
  type ResourceDetail,
} from "@ingot/admin-common";

const APP_PATH = `${IAM_API_PREFIX}/v1/platform/applications`;
const PLAN_PATH = `${IAM_API_PREFIX}/v1/platform/plans`;

const asPage = <T>(res: R<IamPageResponse<T>>): R<Page<T>> => ({
  ...res,
  data: mapIamPage(res.data),
});

export function PlatformApplicationPageAPI(
  page: Page,
  condition?: IamListQuery,
  options?: RequestOptions,
): Promise<R<Page<ResourceDetail<ApplicationRecord>>>> {
  if (condition) {
    filterParams(condition);
  }
  return request
    .get<IamPageResponse<ResourceDetail<ApplicationRecord>>>(
      APP_PATH,
      toIamListParams(page, condition),
      options,
    )
    .then(asPage);
}

export function PlatformApplicationDetailAPI(
  id: string,
  options?: RequestOptions,
): Promise<R<ResourceDetail<ApplicationRecord>>> {
  return request.get<ResourceDetail<ApplicationRecord>>(`${APP_PATH}/${id}`, undefined, options);
}

export function PlatformApplicationCreateAPI(
  params: ApplicationDraft,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  filterParams(params);
  return request.post<CreatedResource>(APP_PATH, params, options);
}

export function PlatformApplicationUpdateAPI(
  id: string,
  params: ApplicationUpdateInput,
  options?: RequestOptions,
): Promise<R<ResourceDetail<ApplicationRecord>>> {
  filterParams(params);
  return request.put<ResourceDetail<ApplicationRecord>>(`${APP_PATH}/${id}`, params, options);
}

export function PlatformApplicationStatusAPI(
  id: string,
  params: ConfigurationStatusInput,
  options?: RequestOptions,
): Promise<R<ResourceDetail<ApplicationRecord>>> {
  filterParams(params);
  return request.patch<ResourceDetail<ApplicationRecord>>(`${APP_PATH}/${id}`, params, options);
}

export function PlatformApplicationDeleteAPI(
  id: string,
  options?: RequestOptions,
): Promise<R<void>> {
  return request.delete<void>(`${APP_PATH}/${id}`, null, options);
}

export function PlatformPlanPageAPI(
  page: Page,
  condition?: IamListQuery,
  options?: RequestOptions,
): Promise<R<Page<ResourceDetail<PlanRecord>>>> {
  if (condition) {
    filterParams(condition);
  }
  return request
    .get<IamPageResponse<ResourceDetail<PlanRecord>>>(
      PLAN_PATH,
      toIamListParams(page, condition),
      options,
    )
    .then(asPage);
}

export function PlatformPlanDetailAPI(
  id: string,
  options?: RequestOptions,
): Promise<R<ResourceDetail<PlanRecord>>> {
  return request.get<ResourceDetail<PlanRecord>>(`${PLAN_PATH}/${id}`, undefined, options);
}

export function PlatformPlanCreateAPI(
  params: PlanDraft,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  filterParams(params);
  return request.post<CreatedResource>(PLAN_PATH, params, options);
}

export function PlatformPlanUpdateAPI(
  id: string,
  params: PlanUpdateInput,
  options?: RequestOptions,
): Promise<R<ResourceDetail<PlanRecord>>> {
  filterParams(params);
  return request.put<ResourceDetail<PlanRecord>>(`${PLAN_PATH}/${id}`, params, options);
}

const catalogPage: Page = { current: 1, size: 200 };

export function PlatformResourcePageAPI(
  applicationId: string,
  page: Page = catalogPage,
  options?: RequestOptions,
): Promise<R<Page<ResourceDetail<AppResourceRecord>>>> {
  return request
    .get<IamPageResponse<ResourceDetail<AppResourceRecord>>>(
      `${APP_PATH}/${applicationId}/resources`,
      toIamListParams(page),
      options,
    )
    .then(asPage);
}

export function PlatformResourceCreateAPI(
  applicationId: string,
  params: AppResourceDraft,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  filterParams(params);
  return request.post<CreatedResource>(`${APP_PATH}/${applicationId}/resources`, params, options);
}

export function PlatformResourceUpdateAPI(
  applicationId: string,
  resourceId: string,
  params: AppResourceUpdateInput,
  options?: RequestOptions,
): Promise<R<ResourceDetail<AppResourceRecord>>> {
  filterParams(params);
  return request.put<ResourceDetail<AppResourceRecord>>(
    `${APP_PATH}/${applicationId}/resources/${resourceId}`,
    params,
    options,
  );
}

export function PlatformResourceDeleteAPI(
  applicationId: string,
  resourceId: string,
  options?: RequestOptions,
): Promise<R<void>> {
  return request.delete<void>(`${APP_PATH}/${applicationId}/resources/${resourceId}`, null, options);
}

export function PlatformActionPageAPI(
  applicationId: string,
  page: Page = catalogPage,
  options?: RequestOptions,
): Promise<R<Page<ResourceDetail<AppActionRecord>>>> {
  return request
    .get<IamPageResponse<ResourceDetail<AppActionRecord>>>(
      `${APP_PATH}/${applicationId}/actions`,
      toIamListParams(page),
      options,
    )
    .then(asPage);
}

export function PlatformActionCreateAPI(
  applicationId: string,
  params: AppActionDraft,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  filterParams(params);
  return request.post<CreatedResource>(`${APP_PATH}/${applicationId}/actions`, params, options);
}

export function PlatformActionUpdateAPI(
  applicationId: string,
  actionId: string,
  params: AppActionUpdateInput,
  options?: RequestOptions,
): Promise<R<ResourceDetail<AppActionRecord>>> {
  filterParams(params);
  return request.put<ResourceDetail<AppActionRecord>>(
    `${APP_PATH}/${applicationId}/actions/${actionId}`,
    params,
    options,
  );
}

export function PlatformActionStatusAPI(
  applicationId: string,
  actionId: string,
  params: ConfigurationStatusInput,
  options?: RequestOptions,
): Promise<R<ResourceDetail<AppActionRecord>>> {
  filterParams(params);
  return request.patch<ResourceDetail<AppActionRecord>>(
    `${APP_PATH}/${applicationId}/actions/${actionId}`,
    params,
    options,
  );
}

export function PlatformActionDeleteAPI(
  applicationId: string,
  actionId: string,
  options?: RequestOptions,
): Promise<R<void>> {
  return request.delete<void>(`${APP_PATH}/${applicationId}/actions/${actionId}`, null, options);
}

export function PlatformMenuPageAPI(
  applicationId: string,
  page: Page = catalogPage,
  options?: RequestOptions,
): Promise<R<Page<ResourceDetail<AppMenuRecord>>>> {
  return request
    .get<IamPageResponse<ResourceDetail<AppMenuRecord>>>(
      `${APP_PATH}/${applicationId}/menus`,
      toIamListParams(page),
      options,
    )
    .then(asPage);
}

export function PlatformMenuCreateAPI(
  applicationId: string,
  params: AppMenuDraft,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  filterParams(params);
  return request.post<CreatedResource>(`${APP_PATH}/${applicationId}/menus`, params, options);
}

export function PlatformMenuUpdateAPI(
  applicationId: string,
  menuId: string,
  params: AppMenuUpdateInput,
  options?: RequestOptions,
): Promise<R<ResourceDetail<AppMenuRecord>>> {
  filterParams(params);
  return request.put<ResourceDetail<AppMenuRecord>>(
    `${APP_PATH}/${applicationId}/menus/${menuId}`,
    params,
    options,
  );
}

export function PlatformMenuDeleteAPI(
  applicationId: string,
  menuId: string,
  options?: RequestOptions,
): Promise<R<void>> {
  return request.delete<void>(`${APP_PATH}/${applicationId}/menus/${menuId}`, null, options);
}
