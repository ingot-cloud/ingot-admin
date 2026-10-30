import { request, type R, type RequestOptions } from "@ingot/admin-core";
import { IAM_API_PREFIX } from "@ingot/admin-common";
import type { TenantWorkbenchStatistics } from "@/models/workbench";

const PATH = `${IAM_API_PREFIX}/v1/tenant/workbench/statistics`;

/** 当前身份统计；不接受客户端指定组织或数据范围。 */
export function TenantWorkbenchStatisticsAPI(
  options?: RequestOptions,
): Promise<R<TenantWorkbenchStatistics>> {
  return request.get<TenantWorkbenchStatistics>(PATH, undefined, options);
}
