import { filterParams, request, type RequestOptions } from "@ingot/admin-core";
import type { Page, R } from "@ingot/admin-core";
import {
  IAM_API_PREFIX,
  mapIamPage,
  toIamListParams,
  type ConfigurationStatusInput,
  type CreatedResource,
  type EntitlementPreviewResult,
  type EntitlementRecord,
  type EntitlementReplaceInput,
  type IamListQuery,
  type IamPageResponse,
  type Preview,
  type ResourceDetail,
  type TenantCreateInput,
  type TenantPreviewResult,
  type TenantRecord,
  type TenantUpdateInput,
  type VersionInput,
} from "@ingot/admin-common";

const PATH = `${IAM_API_PREFIX}/v1/platform/tenants`;

const asPage = <T>(
  res: R<IamPageResponse<T>>,
): R<Page<T>> => ({
  ...res,
  data: mapIamPage(res.data),
});

export function PlatformTenantPageAPI(
  page: Page,
  condition?: IamListQuery,
  options?: RequestOptions,
): Promise<R<Page<ResourceDetail<TenantRecord>>>> {
  if (condition) {
    filterParams(condition);
  }
  return request
    .get<IamPageResponse<ResourceDetail<TenantRecord>>>(
      PATH,
      toIamListParams(page, condition),
      options,
    )
    .then(asPage);
}

export function PlatformTenantDetailAPI(
  id: string,
  options?: RequestOptions,
): Promise<R<ResourceDetail<TenantRecord>>> {
  return request.get<ResourceDetail<TenantRecord>>(`${PATH}/${id}`, undefined, options);
}

export function PlatformTenantPreviewAPI(
  params: TenantCreateInput,
  options?: RequestOptions,
): Promise<R<Preview<TenantPreviewResult>>> {
  filterParams(params);
  return request.post<Preview<TenantPreviewResult>>(`${PATH}/preview`, params, options);
}

export function PlatformTenantCreateAPI(
  params: TenantCreateInput,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  filterParams(params);
  return request.post<CreatedResource>(PATH, params, options);
}

export function PlatformTenantUpdateAPI(
  id: string,
  params: TenantUpdateInput,
  options?: RequestOptions,
): Promise<R<ResourceDetail<TenantRecord>>> {
  filterParams(params);
  return request.patch<ResourceDetail<TenantRecord>>(`${PATH}/${id}`, params, options);
}

export function PlatformTenantEntitlementsAPI(
  id: string,
  options?: RequestOptions,
): Promise<R<Array<ResourceDetail<EntitlementRecord>>>> {
  return request.get<Array<ResourceDetail<EntitlementRecord>>>(
    `${PATH}/${id}/entitlements`,
    undefined,
    options,
  );
}

export function PlatformTenantEntitlementsReplaceAPI(
  id: string,
  params: EntitlementReplaceInput,
  options?: RequestOptions,
): Promise<R<Array<ResourceDetail<EntitlementRecord>>>> {
  filterParams(params);
  return request.put<Array<ResourceDetail<EntitlementRecord>>>(
    `${PATH}/${id}/entitlements`,
    params,
    options,
  );
}

export function PlatformTenantEntitlementsPreviewAPI(
  id: string,
  params: EntitlementReplaceInput,
  options?: RequestOptions,
): Promise<R<Preview<EntitlementPreviewResult>>> {
  filterParams(params);
  return request.post<Preview<EntitlementPreviewResult>>(
    `${PATH}/${id}/entitlements/preview`,
    params,
    options,
  );
}

export type { ConfigurationStatusInput, VersionInput };
