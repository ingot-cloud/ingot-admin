import { keepPreviousData, useQuery, type QueryKey } from "@tanstack/vue-query";
import { computed, reactive, readonly, ref, toValue, type MaybeRefOrGetter } from "vue";

/** 游标分页响应的最小形状：不含总数，只知道是否还有下一页。 */
export type CursorPage<T> = {
  items: T[];
  nextCursor?: string;
  hasMore: boolean;
};

export type CursorPagingQueryInput<C> = {
  cursor?: string;
  size: number;
  condition: C;
};

export type CursorPagingQueryOptions<C> = (
  input: MaybeRefOrGetter<CursorPagingQueryInput<C>>,
) => { queryKey: QueryKey };

export interface UseCursorPagingOptions<C> {
  queryOptions: CursorPagingQueryOptions<C>;
  initialCondition?: C;
  initialSize?: number;
  enabled?: MaybeRefOrGetter<boolean>;
}

const cloneCondition = <C>(condition: C): C => JSON.parse(JSON.stringify(condition ?? {})) as C;

/**
 * 游标分页：维护编辑中条件与已提交条件，以及已访问页的游标栈。
 * 上一页复用栈中游标，不需要后端反向查询；条件、条数变化后回到第一页。
 */
export function useCursorPaging<P extends CursorPage<unknown>, C extends object>(
  options: UseCursorPagingOptions<C>,
) {
  const condition = reactive(cloneCondition(options.initialCondition ?? ({} as C))) as C;
  const submitted = ref(cloneCondition(condition));
  const size = ref(options.initialSize ?? 20);
  const cursors = ref<Array<string | undefined>>([undefined]);
  const index = ref(0);

  const enabled = computed(() =>
    options.enabled === undefined ? true : Boolean(toValue(options.enabled)),
  );

  const input = computed<CursorPagingQueryInput<C>>(() => ({
    cursor: cursors.value[index.value],
    size: size.value,
    condition: cloneCondition(submitted.value),
  }));

  const query = useQuery<P>(() => ({
    ...options.queryOptions(input),
    enabled: enabled.value,
    placeholderData: keepPreviousData,
  }) as never);

  const data = computed<P | undefined>(() => (enabled.value ? query.data.value : undefined));
  const records = computed(() => (data.value?.items ?? []) as P["items"]);
  const settled = computed(() => !query.isPlaceholderData.value && !query.isFetching.value);
  const hasNext = computed(
    () => settled.value && Boolean(data.value?.hasMore && data.value.nextCursor),
  );
  const hasPrev = computed(() => index.value > 0);

  const toFirstPage = (): void => {
    cursors.value = [undefined];
    index.value = 0;
  };

  const search = (): void => {
    submitted.value = cloneCondition(condition);
    toFirstPage();
    void Promise.resolve().then(() => {
      if (enabled.value) {
        void query.refetch();
      }
    });
  };

  const next = (): void => {
    const cursor = data.value?.nextCursor;
    if (!hasNext.value || !cursor) {
      return;
    }
    cursors.value = [...cursors.value.slice(0, index.value + 1), cursor];
    index.value += 1;
  };

  const prev = (): void => {
    if (index.value > 0) {
      index.value -= 1;
    }
  };

  const changeSize = (value: number): void => {
    size.value = value;
    toFirstPage();
  };

  const resetSubmitted = (nextCondition?: C): void => {
    if (nextCondition) {
      Object.keys(condition).forEach((key) => {
        delete (condition as Record<string, unknown>)[key];
      });
      Object.assign(condition, cloneCondition(nextCondition));
    }
    submitted.value = cloneCondition(condition);
    toFirstPage();
  };

  return {
    condition,
    submitted: readonly(submitted),
    size: readonly(size),
    page: computed(() => index.value + 1),
    data,
    records,
    hasNext,
    hasPrev,
    loading: computed(() => query.isLoading.value),
    fetching: computed(() => query.isFetching.value),
    search,
    next,
    prev,
    changeSize,
    resetSubmitted,
    query,
  };
}
