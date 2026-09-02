import { filterParams, request } from "@ingot/admin-core";
import type { LoadDataParams, Page, R } from "@ingot/admin-core";
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
): Promise<R<Page<TenantOption>>> {
  return request.get<Page<TenantOption>>(`${PATH}/page`, toTenantOptionPageParams(page, condition));
}

export const loadTenantOptions = async (params: LoadDataParams): Promise<Page<TenantOption>> => {
  const result = await TenantOptionPageAPI(
    {
      current: params.current,
      size: params.size,
    },
    {
      name: params.query,
    },
  );
  return result.data;
};
