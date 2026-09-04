import { afterEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, toValue } from "vue";
import { mount } from "@vue/test-utils";
import { VueQueryPlugin, queryOptions } from "@tanstack/vue-query";
import { createAdminQueryClient } from "./client";
import { useServerPaging } from "./paging";
import type { Page } from "@/models";

describe("useServerPaging", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("搜索提交条件并回到第一页，翻页保留上一页数据", async () => {
    const calls: Array<{ current: number; name?: string }> = [];
    const client = createAdminQueryClient({ staleTime: 0 });
    const Host = defineComponent({
      setup() {
        const paging = useServerPaging<{ id: string }, { name?: string }>({
          queryOptions: (input) => {
            const value = toValue(input);
            return queryOptions({
              queryKey: ["test", "page", value],
              queryFn: async (): Promise<Page<{ id: string }>> => {
                calls.push({ current: value.current, name: value.condition.name });
                return {
                  current: value.current,
                  size: value.size,
                  total: 40,
                  records: [{ id: `${value.current}` }],
                };
              },
            });
          },
        });
        return { paging };
      },
      render() {
        return h("div");
      },
    });

    const wrapper = mount(Host, {
      global: {
        plugins: [[VueQueryPlugin, { queryClient: client }]],
      },
    });
    const paging = wrapper.vm.paging;

    paging.condition.name = "draft";
    expect(calls).toHaveLength(1);
    expect(calls[0]?.name).toBeUndefined();

    paging.search();
    await vi.waitFor(() => expect(calls.some((item) => item.name === "draft")).toBe(true));
    expect(paging.pageInfo.value.current).toBe(1);

    paging.fetchData({ type: "current", value: 2 });
    await vi.waitFor(() => expect(calls.some((item) => item.current === 2)).toBe(true));
    expect(paging.pageInfo.value.records?.length).toBeGreaterThan(0);

    wrapper.unmount();
  });

  it("enabled 为 false 时不发请求", async () => {
    let fetched = 0;
    const client = createAdminQueryClient();
    const Host = defineComponent({
      setup() {
        const paging = useServerPaging<{ id: string }, Record<string, never>>({
          enabled: false,
          queryOptions: () =>
            queryOptions({
              queryKey: ["disabled"],
              queryFn: async () => {
                fetched += 1;
                return { current: 1, size: 20, total: 0, records: [] };
              },
            }),
        });
        return { paging };
      },
      render() {
        return h("div");
      },
    });
    const wrapper = mount(Host, {
      global: {
        plugins: [[VueQueryPlugin, { queryClient: client }]],
      },
    });
    await Promise.resolve();
    expect(fetched).toBe(0);
    wrapper.unmount();
  });

  it("queryWhen 为 false 时不发请求且表格为空", async () => {
    let fetched = 0;
    const client = createAdminQueryClient();
    const Host = defineComponent({
      setup() {
        const paging = useServerPaging<{ id: string }, { userId?: string }>({
          queryWhen: (submitted) => Boolean(submitted.userId),
          queryOptions: (input) =>
            queryOptions({
              queryKey: ["gated", toValue(input)],
              queryFn: async () => {
                fetched += 1;
                return { current: 1, size: 20, total: 1, records: [{ id: "1" }] };
              },
            }),
        });
        return { paging };
      },
      render() {
        return h("div");
      },
    });
    const wrapper = mount(Host, {
      global: {
        plugins: [[VueQueryPlugin, { queryClient: client }]],
      },
    });
    await Promise.resolve();
    expect(fetched).toBe(0);
    expect(wrapper.vm.paging.pageInfo.value.records).toEqual([]);
    wrapper.unmount();
  });
});
