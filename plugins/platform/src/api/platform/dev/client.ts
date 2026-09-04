import { request, type RequestOptions } from "@ingot/admin-core";
import type { R, Page, OAuth2RegisteredClient, AppSecretVO } from "@/models";
import { filterParams } from "@ingot/admin-core";

const PATH = "/api/auth/client";

export function ClientPageAPI(
  page: Page,
  condition?: OAuth2RegisteredClient,
  options?: RequestOptions,
): Promise<R<Page<OAuth2RegisteredClient>>> {
  if (condition) {
    filterParams(condition);
  }
  return request.get<Page<OAuth2RegisteredClient>>(
    `${PATH}/page`,
    {
      ...page,
      ...condition,
    },
    options,
  );
}

export function GetClientInfoAPI(
  id: string,
  options?: RequestOptions,
): Promise<R<OAuth2RegisteredClient>> {
  return request.get<OAuth2RegisteredClient>(`${PATH}/${id}`, undefined, options);
}

export function CreateClientAPI(
  params: OAuth2RegisteredClient,
  options?: RequestOptions,
): Promise<R<AppSecretVO>> {
  filterParams(params);
  return request.post<AppSecretVO>(`${PATH}`, params, options);
}

export function UpdateClientAPI(
  params: OAuth2RegisteredClient,
  options?: RequestOptions,
): Promise<R<void>> {
  filterParams(params);
  return request.put<void>(`${PATH}`, params, options);
}

export function RemoveClientAPI(clientId: string, options?: RequestOptions): Promise<R<void>> {
  return request.delete<void>(`${PATH}/${clientId}`, null, options);
}

export function ResetClientSecretAPI(
  clientId: string,
  options?: RequestOptions,
): Promise<R<AppSecretVO>> {
  return request.put<AppSecretVO>(`${PATH}/secret/${clientId}`, undefined, options);
}
