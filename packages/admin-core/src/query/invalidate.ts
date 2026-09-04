import type { QueryClient, QueryKey } from "@tanstack/vue-query";

export const invalidateQueriesByKeys = (
  queryClient: QueryClient,
  keys: ReadonlyArray<QueryKey>,
): Promise<void> =>
  Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey }))).then(() => undefined);
