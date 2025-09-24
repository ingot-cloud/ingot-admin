import request from "@/net";
import type { R, Page, OAuth2RegisteredClient, AppSecretVO } from "@/models";
import { filterParams } from "@/utils/object";

/**
 * 获取分页信息
 * @returns
 */
export function ClientPageAPI(
  page: Page,
  condition?: OAuth2RegisteredClient,
): Promise<R<Page<OAuth2RegisteredClient>>> {
  if (condition) {
    filterParams(condition);
  }
  return request.get<Page<OAuth2RegisteredClient>>("/api/pms/v1/admin/client/page", {
    ...page,
    ...condition,
  });
}

/**
 * 获取客户端信息
 * @param id ID
 * @returns
 */
export function GetClientInfoAPI(id: string): Promise<R<OAuth2RegisteredClient>> {
  return request.get<OAuth2RegisteredClient>(`/api/pms/v1/admin/client/${id}`);
}

/**
 * 创建客户端
 * @param params 参数
 * @returns
 */
export function CreateClientAPI(params: OAuth2RegisteredClient): Promise<R<AppSecretVO>> {
  filterParams(params);
  return request.post<AppSecretVO>("/api/pms/v1/admin/client", params);
}

/**
 * 更新客户端信息
 * @param params 参数
 * @returns
 */
export function UpdateClientAPI(params: OAuth2RegisteredClient): Promise<R<void>> {
  filterParams(params);
  return request.put<void>("/api/pms/v1/admin/client", params);
}

/**
 * 删除客户端
 * @param clientId clientId
 * @returns
 */
export function RemoveClientAPI(clientId: string): Promise<R<void>> {
  return request.delete<void>(`/api/pms/v1/admin/client/${clientId}`);
}

/**
 * 重置秘钥
 */
export function ResetClientSecretAPI(clientId: string): Promise<R<AppSecretVO>> {
  return request.put<AppSecretVO>(`/api/pms/v1/admin/client/resetSecret/${clientId}`);
}
