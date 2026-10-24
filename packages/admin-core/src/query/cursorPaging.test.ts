import { afterEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, ref, toValue } from "vue";
import { mount } from "@vue/test-utils";
import { VueQueryPlugin, queryOptions } from "@tanstack/vue-query";
import { createAdminQueryClient } from "./client";
import { useCursorPaging, type CursorPage } from "./cursorPaging";

type Row = { id: string };
type Condition = { name?: string };

const PAGES = 3;

const mountPaging = (enabled = ref(true)) => {
  const calls: Array<{ cursor?: string; size: number; name?: string }> = [];
  const client = createAdminQueryClient({ staleTime: 0 });
  const Host = defineComponent({
    setup() {
      const paging = useCursorPaging<CursorPage<Row>, Condition>({
        enabled,
        queryOptions: (input) => {
          const value = toValue(input);
          return queryOptions({
            queryKey: ["cursor-test", value],
            queryFn: async (): Promise<CursorPage<Row>> => {
              calls.push({ cursor: value.cursor, size: value.size, name: value.condition.name });
              const page = value.cursor ? Number(value.cursor) : 1;
              return {
                items: [{ id: `${value.condition.name ?? ""}${page}` }],
                hasMore: page < PAGES,
                nextCursor: page < PAGES ? `${page + 1}` : undefined,
              };
            },
          });
        },
      });
      return { paging };
    },
    render: () => h("div"),
  });
  const wrapper = mount(Host, { global: { plugins: [[VueQueryPlugin, { queryClient: client }]] } });
  return { wrapper, calls, paging: wrapper.vm.paging };
};

describe("useCursorPaging", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("下一页压入游标，上一页复用栈中游标，末页不可继续", async () => {
    const { wrapper, paging, calls } = mountPaging();
    await vi.waitFor(() => expect(paging.hasNext.value).toBe(true));
    expect(paging.hasPrev.value).toBe(false);
    paging.next();
    await vi.waitFor(() => expect(paging.records.value[0]?.id).toBe("2"));
    expect(paging.page.value).toBe(2);
    paging.next();
    await vi.waitFor(() => expect(paging.records.value[0]?.id).toBe("3"));
    expect(paging.hasNext.value).toBe(false);
    paging.next();
    expect(paging.page.value).toBe(3);
    paging.prev();
    await vi.waitFor(() => expect(paging.records.value[0]?.id).toBe("2"));
    expect(calls.filter((call) => call.cursor === "2").length).toBeGreaterThanOrEqual(1);
    expect(calls.map((call) => call.cursor)).toContain("3");
    wrapper.unmount();
  });

  it("提交筛选与切换条数都回到第一页", async () => {
    const { wrapper, paging, calls } = mountPaging();
    await vi.waitFor(() => expect(paging.hasNext.value).toBe(true));
    paging.next();
    await vi.waitFor(() => expect(paging.page.value).toBe(2));
    paging.condition.name = "a";
    paging.search();
    await vi.waitFor(() => expect(paging.records.value[0]?.id).toBe("a1"));
    expect(paging.page.value).toBe(1);
    expect(paging.hasPrev.value).toBe(false);
    await vi.waitFor(() => expect(paging.hasNext.value).toBe(true));
    paging.next();
    await vi.waitFor(() => expect(paging.page.value).toBe(2));
    paging.changeSize(50);
    await vi.waitFor(() => expect(calls.some((call) => call.size === 50 && !call.cursor)).toBe(true));
    expect(paging.page.value).toBe(1);
    paging.resetSubmitted({});
    await vi.waitFor(() => expect(paging.records.value[0]?.id).toBe("1"));
    expect(paging.condition.name).toBeUndefined();
    wrapper.unmount();
  });

  it("未启用时不请求、无数据", async () => {
    const enabled = ref(false);
    const { wrapper, paging, calls } = mountPaging(enabled);
    await Promise.resolve();
    expect(calls).toHaveLength(0);
    expect(paging.records.value).toEqual([]);
    expect(paging.hasNext.value).toBe(false);
    enabled.value = true;
    await vi.waitFor(() => expect(calls).toHaveLength(1));
    wrapper.unmount();
  });
});
