import { createIamListLoader } from "./option-loader";
import {
  request,
  useCapabilities,
  type Page,
  type R,
  type RequestOptions,
} from "@ingot/admin-core";
import { IAM_API_PREFIX, IamAction } from "../../models/iam/constants";
import { mapIamPage, toIamListParams, toIamSelectRecords } from "../../models/iam/helpers";
import type {
  IamListQuery,
  IamPageResponse,
  ResourceDetail,
  TenantRecord,
} from "../../models/iam/types";
const PATH = `${IAM_API_PREFIX}/v1/platform/tenants`;
/** 平台租户目录的分页选项接口，管理域固定。 */
export function PlatformTenantOptionPageAPI(
  page: Page,
  condition?: IamListQuery,
  options?: RequestOptions,
): Promise<R<Page<ResourceDetail<TenantRecord>>>> {
  return request
    .get<IamPageResponse<ResourceDetail<TenantRecord>>>(
      PATH,
      toIamListParams(page, condition),
      options,
    )
    .then((response) => ({ ...response, data: mapIamPage(response.data) }));
}
/** 按独立租户目录读取权限加载选项，不扩大当前页面授权。 */
export function usePlatformTenantOptions() {
  const { hasAction } = useCapabilities();
  return createIamListLoader(async (page, condition) => {
    if (!hasAction(IamAction.PLATFORM_TENANT_READ)) throw new Error("需要租户目录读取权限");
    const response = await PlatformTenantOptionPageAPI(page, condition);
    return { data: toIamSelectRecords(response.data) };
  });
}
