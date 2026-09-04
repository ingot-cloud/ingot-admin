import { keepPreviousData, useQuery, type QueryKey } from "@tanstack/vue-query";
import type { MaybeRefOrGetter } from "vue";
import type { Page, PageChangeParams } from "@/models";

export type ServerPagingQueryInput<C> = {
  current: number;
  size: number;
  condition: C;
};

export type ServerPagingQueryOptions<T, C> = (
  input: MaybeRefOrGetter<ServerPagingQueryInput<C>>,
) => { queryKey: QueryKey };

export interface UseServerPagingOptions<T, C> {
  queryOptions: ServerPagingQueryOptions<T, C>;
  initialCondition?: C;
  initialPage?: Pick<Page<T>, "current" | "size">;
  enabled?: MaybeRefOrGetter<boolean>;
  /** 基于已提交条件决定是否发请求，例如会话查询必须带 clientId 或 userId。 */
  queryWhen?: (submitted: C) => boolean;
}

const cloneCondition = <C>(condition: C): C => JSON.parse(JSON.stringify(condition ?? {})) as C;

/**
 * 服务端分页：维护编辑中条件与已提交条件，页码进入 Query Key。
 */
export function useServerPaging<T, C extends object>(options: UseServerPagingOptions<T, C>) {
  const condition = reactive(cloneCondition(options.initialCondition ?? ({} as C))) as C;
  const submitted = ref(cloneCondition(condition));
  const current = ref(options.initialPage?.current ?? 1);
  const size = ref(options.initialPage?.size ?? 20);

  const enabled = computed(() => {
    const flag = options.enabled === undefined ? true : Boolean(toValue(options.enabled));
    if (!flag) {
      return false;
    }
    if (options.queryWhen) {
      return options.queryWhen(submitted.value);
    }
    return true;
  });

  const input = computed<ServerPagingQueryInput<C>>(() => ({
    current: current.value,
    size: size.value,
    condition: cloneCondition(submitted.value),
  }));

  const query = useQuery<Page<T>>(() => ({
    ...options.queryOptions(input),
    enabled: enabled.value,
    placeholderData: keepPreviousData,
  }) as never);

  const pageInfo = computed<Page<T>>(() => ({
    current: current.value,
    size: size.value,
    total: enabled.value ? Number(query.data.value?.total ?? 0) : 0,
    records: enabled.value ? (query.data.value?.records ?? []) : [],
  }));

  const search = (): void => {
    submitted.value = cloneCondition(condition);
    current.value = 1;
  };

  const fetchData = (params?: PageChangeParams): void => {
    if (params) {
      if (params.type === "current") {
        current.value = params.value;
      } else {
        size.value = params.value;
        current.value = 1;
      }
      return;
    }
    search();
  };

  const resetSubmitted = (next?: C): void => {
    if (next) {
      Object.keys(condition).forEach((key) => {
        delete (condition as Record<string, unknown>)[key];
      });
      Object.assign(condition, cloneCondition(next));
    }
    submitted.value = cloneCondition(condition);
    current.value = 1;
  };

  return {
    condition,
    submitted: readonly(submitted),
    pageInfo,
    loading: computed(() => query.isLoading.value),
    fetching: computed(() => query.isFetching.value),
    isPlaceholderData: computed(() => query.isPlaceholderData.value),
    search,
    fetchData,
    resetSubmitted,
    query,
  };
}
