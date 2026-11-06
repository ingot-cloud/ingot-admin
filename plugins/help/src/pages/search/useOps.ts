import { computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useServerPaging, snapshotQueryParams } from "@ingot/admin-core";
import type { ServerPagingQueryInput } from "@ingot/admin-core";
import { toValue, type MaybeRefOrGetter } from "vue";
import { useHelpRuntime } from "../../runtime";
import type { HelpSearchHit } from "../../models/help";
import { restoreHelpPosition } from "../../hooks/scroll";
import { HELP_SEARCH_PAGE_SIZE } from "./table";
interface Condition {
  q: string;
  categoryId?: string;
}
export const useOps = () => {
  const runtime = useHelpRuntime(),
    route = useRoute(),
    router = useRouter();
  const condition = (): Condition => ({
    q: String(route.query.q ?? ""),
    categoryId: typeof route.query.categoryId === "string" ? route.query.categoryId : undefined,
  });
  const paging = useServerPaging<HelpSearchHit, Condition>({
    initialCondition: condition(),
    initialPage: {
      current: Math.max(1, Number(route.query.page) || 1),
      size: HELP_SEARCH_PAGE_SIZE,
    },
    enabled: () => Boolean(runtime.catalog.value),
    queryWhen: (value) => Boolean(value.q.trim()),
    queryOptions: (input: MaybeRefOrGetter<ServerPagingQueryInput<Condition>>) => {
      const value = toValue(input);
      return {
        queryKey: [
          "help",
          runtime.scope(),
          "search-page",
          runtime.catalog.value?.contentVersion,
          snapshotQueryParams(value),
        ],
        queryFn: async () => {
          const response = await runtime.search(
            value.condition.q,
            value.condition.categoryId,
            value.current,
            value.size,
          );
          return {
            records: response.items,
            total: response.total,
            current: response.page,
            size: response.pageSize,
          };
        },
        retry: false,
        meta: { skipGlobalError: true },
      };
    },
  });
  watch(
    () => route.fullPath,
    () => {
      paging.resetSubmitted(condition());
      paging.fetchData({ type: "current", value: Math.max(1, Number(route.query.page) || 1) });
    },
  );
  watch(
    () => paging.query.data.value,
    (data) => {
      if (data) void restoreHelpPosition(runtime, route.fullPath);
    },
    { immediate: true },
  );
  const changePage = (page: number): void => {
    void router.push({ name: "help.search", query: { ...route.query, page: String(page) } });
  };
  return {
    q: computed(() => String(route.query.q ?? "")),
    pageInfo: paging.pageInfo,
    loading: computed(() => paging.fetching.value),
    error: paging.query.error,
    retry: () => paging.query.refetch(),
    changePage,
  };
};
