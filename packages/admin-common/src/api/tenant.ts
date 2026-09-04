import { filterParams, request, type RequestOptions } from "@ingot/admin-core";
import type { Page, R } from "@ingot/admin-core";
import type { TenantOption, TenantOptionQuery } from "../models/tenant";

const PATH = "/api/pms/v1/platform/org/tenant";

export const toTenantOptionPageParams = (
  page: Page,
  condition?: TenantOptionQuery,
): Page & TenantOptionQuery => {
  if (condition) {
    filterParams(condition);
  }
  return {
    ...page,
    ...condition,
  };
};

export function TenantOptionPageAPI(
  page: Page,
  condition?: TenantOptionQuery,
  options?: RequestOptions,
): Promise<R<Page<TenantOption>>> {
  return request.get<Page<TenantOption>>(
    `${PATH}/page`,
    toTenantOptionPageParams(page, condition),
    options,
  );
}
