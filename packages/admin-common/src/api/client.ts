import { filterParams, request } from "@ingot/admin-core";
import type { LoadDataParams, Page, R } from "@ingot/admin-core";
import type { ClientOption, ClientOptionQuery } from "../models/client";

const PATH = "/api/auth/client";

export const toClientOptionPageParams = (
  page: Page,
  condition?: ClientOptionQuery,
): Page & ClientOptionQuery => {
  if (condition) {
    filterParams(condition);
  }
  return {
    ...page,
    ...condition,
  };
};

export function ClientOptionPageAPI(
  page: Page,
  condition?: ClientOptionQuery,
): Promise<R<Page<ClientOption>>> {
  return request.get<Page<ClientOption>>(`${PATH}/page`, toClientOptionPageParams(page, condition));
}

export const loadClientOptions = async (params: LoadDataParams): Promise<Page<ClientOption>> => {
  const result = await ClientOptionPageAPI(
    {
      current: params.current,
      size: params.size,
    },
    {
      clientName: params.query,
    },
  );
  return result.data;
};
