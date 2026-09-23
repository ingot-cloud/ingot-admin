import { filterParams, request, type RequestOptions } from "@ingot/admin-core";
import type { Page, R } from "@ingot/admin-core";
import {
  AccountLookupPurpose,
  IAM_API_PREFIX,
  mapIamPage,
  toIamListParams,
  type AccountCreateInput,
  type AccountListQuery,
  type AccountLockInput,
  type AccountLookupInput,
  type AccountRecord,
  type AccountSecret,
  type AccountUpdateInput,
  type CreatedResource,
  type IamPageResponse,
  type ResourceDetail,
  type VersionInput,
} from "@ingot/admin-common";

const PATH = `${IAM_API_PREFIX}/v1/platform/accounts`;

const secretCrypto = {
  crypto: {
    response: { mode: "data_only" as const },
  },
};

const asPage = <T>(res: R<IamPageResponse<T>>): R<Page<T>> => ({
  ...res,
  data: mapIamPage(res.data),
});

const lookupToPage = (
  res: R<ResourceDetail<AccountRecord>>,
): R<Page<ResourceDetail<AccountRecord>>> => ({
  ...res,
  data: mapIamPage({
    items: res.data ? [res.data] : [],
    total: res.data ? 1 : 0,
    page: 1,
    pageSize: 1,
  }),
});

const lookupFieldsOf = (condition?: AccountListQuery): AccountLookupInput | undefined => {
  if (!condition) {
    return undefined;
  }
  const username = condition.username?.trim();
  const phone = condition.phone?.trim();
  const email = condition.email?.trim();
  if (!username && !phone && !email) {
    return undefined;
  }
  return {
    purpose: AccountLookupPurpose.ACCOUNT_MANAGE,
    username: username || undefined,
    phone: phone || undefined,
    email: email || undefined,
  };
};

export function PlatformAccountPageAPI(
  page: Page,
  condition?: AccountListQuery,
  options?: RequestOptions,
): Promise<R<Page<ResourceDetail<AccountRecord>>>> {
  const lookup = lookupFieldsOf(condition);
  if (lookup) {
    return PlatformAccountLookupAPI(lookup, options).then(lookupToPage);
  }
  return request
    .get<IamPageResponse<ResourceDetail<AccountRecord>>>(PATH, toIamListParams(page), options)
    .then(asPage);
}

export function PlatformAccountDetailAPI(
  id: string,
  options?: RequestOptions,
): Promise<R<ResourceDetail<AccountRecord>>> {
  return request.get<ResourceDetail<AccountRecord>>(`${PATH}/${id}`, undefined, options);
}

export function PlatformAccountLookupAPI(
  params: AccountLookupInput,
  options?: RequestOptions,
): Promise<R<ResourceDetail<AccountRecord>>> {
  filterParams(params);
  return request.post<ResourceDetail<AccountRecord>>(`${PATH}/lookup`, params, options);
}

export function PlatformAccountCreateAPI(
  params: AccountCreateInput,
  options?: RequestOptions,
): Promise<R<AccountSecret>> {
  filterParams(params);
  return request.post<AccountSecret>(PATH, params, { ...options, ...secretCrypto });
}

export function PlatformAccountUpdateAPI(
  id: string,
  params: AccountUpdateInput,
  options?: RequestOptions,
): Promise<R<ResourceDetail<AccountRecord>>> {
  filterParams(params);
  return request.patch<ResourceDetail<AccountRecord>>(`${PATH}/${id}`, params, options);
}

export function PlatformAccountDeleteAPI(
  id: string,
  params: VersionInput,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  filterParams(params);
  return request.delete<CreatedResource>(`${PATH}/${id}`, params, options);
}

export function PlatformAccountEnableAPI(
  id: string,
  params: VersionInput,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  filterParams(params);
  return request.post<CreatedResource>(`${PATH}/${id}/enable`, params, options);
}

export function PlatformAccountDisableAPI(
  id: string,
  params: VersionInput,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  filterParams(params);
  return request.post<CreatedResource>(`${PATH}/${id}/disable`, params, options);
}

export function PlatformAccountLockAPI(
  id: string,
  params: AccountLockInput,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  filterParams(params);
  return request.post<CreatedResource>(`${PATH}/${id}/lock`, params, options);
}

export function PlatformAccountUnlockAPI(
  id: string,
  params: VersionInput,
  options?: RequestOptions,
): Promise<R<CreatedResource>> {
  filterParams(params);
  return request.post<CreatedResource>(`${PATH}/${id}/unlock`, params, options);
}

export function PlatformAccountResetPasswordAPI(
  id: string,
  params: VersionInput,
  options?: RequestOptions,
): Promise<R<AccountSecret>> {
  filterParams(params);
  return request.post<AccountSecret>(`${PATH}/${id}/reset-password`, params, {
    ...options,
    ...secretCrypto,
  });
}
