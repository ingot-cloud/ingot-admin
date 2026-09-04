import { filterParams, request, type RequestOptions } from "@ingot/admin-core";
import type { Page, R } from "@ingot/admin-core";
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
  options?: RequestOptions,
): Promise<R<Page<ClientOption>>> {
  return request.get<Page<ClientOption>>(
    `${PATH}/page`,
    toClientOptionPageParams(page, condition),
    options,
  );
}
