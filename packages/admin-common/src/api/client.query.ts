import { queryOptions } from "@tanstack/vue-query";
import {
  createResourceQueryKeys,
  queryAdminData,
  REFERENCE_QUERY_STALE_TIME,
  silentQueryRequest,
  snapshotQueryParams,
  type LoadDataParams,
  type Page,
} from "@ingot/admin-core";
import type { ClientOption, ClientOptionQuery } from "../models/client";
import { ClientOptionPageAPI } from "./client";

export const clientOptionQueryKeys = createResourceQueryKeys("common", "client-option");

export function ClientOptionPageQueryOptions(input: {
  page: Page;
  condition?: ClientOptionQuery;
}) {
  return queryOptions({
    queryKey: clientOptionQueryKeys.list(snapshotQueryParams(input)),
    staleTime: REFERENCE_QUERY_STALE_TIME,
    queryFn: ({ signal }): Promise<Page<ClientOption>> =>
      ClientOptionPageAPI(input.page, { ...input.condition }, silentQueryRequest(signal)).then(
        ({ data }) => data,
      ),
  });
}

export const loadClientOptions = async (params: LoadDataParams): Promise<Page<ClientOption>> => {
  return queryAdminData(
    ClientOptionPageQueryOptions({
      page: {
        current: params.current,
        size: params.size,
      },
      condition: {
        clientName: params.query,
      },
    }),
  );
};
