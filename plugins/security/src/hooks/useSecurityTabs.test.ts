// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { defineComponent, h, ref, type Ref } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { QueryClient, VueQueryPlugin, useQuery } from "@tanstack/vue-query";
import { useActiveSecurityRead, useSecurityTabs, SecurityAction } from "./useSecurityTabs";
vi.mock("@ingot/admin-core", async () => {
  const { inject } = await import("vue");
  return {
    useCapabilities: () => {
      const codes = inject<Ref<string[]>>("codes")!;
      return { hasAction: (code: string) => codes.value.includes(code) };
    },
  };
});
const options = [
  { value: "session", label: "会话" },
  { value: "policy", label: "并发" },
];
const actions = { session: SecurityAction.SESSION_READ, policy: SecurityAction.CONCURRENCY_READ };
function create(codes: string[]) {
  const permissionCodes = ref(codes);
  const fetch = vi.fn(async (tab: string) => tab);
  let tabs: ReturnType<typeof useSecurityTabs>;
  const panel = defineComponent({
    props: { tab: { type: String, required: true } },
    setup(props) {
      const enabled = useActiveSecurityRead(actions[props.tab as keyof typeof actions], props.tab);
      useQuery(() => ({
        queryKey: [props.tab],
        enabled: enabled.value,
        queryFn: () => fetch(props.tab),
        staleTime: Infinity,
      }));
      return () => h("div");
    },
  });
  const root = defineComponent({
    setup() {
      tabs = useSecurityTabs(options, actions);
      return () =>
        h(
          "div",
          options
            .filter((item) => tabs.allowed(item.value) && tabs.visitedTabs.value[item.value])
            .map((item) => h(panel, { tab: item.value, key: item.value })),
        );
    },
  });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = mount(root, {
    global: {
      provide: { codes: permissionCodes },
      plugins: [[VueQueryPlugin, { queryClient: client }]],
    },
  });
  return {
    get tabs() {
      return tabs;
    },
    fetch,
    permissionCodes,
    client,
    cleanup: () => {
      wrapper.unmount();
      client.clear();
    },
  };
}
describe("安全页签的实际请求门禁", () => {
  it("只有并发权限时默认进入并发，旧码和前缀不授予会话权限", async () => {
    const page = create([
      SecurityAction.CONCURRENCY_READ,
      "iam-platform:session",
      "platform:security:session:query",
    ]);
    await flushPromises();
    expect(page.tabs.activeTab.value).toBe("policy");
    expect(page.fetch.mock.calls).toEqual([["policy"]]);
    page.cleanup();
  });
  it("只取激活面板；访问过的非活动面板在失效时不请求", async () => {
    const page = create(Object.values(actions));
    await flushPromises();
    expect(page.fetch.mock.calls).toEqual([["session"]]);
    page.tabs.activeTab.value = "policy";
    await flushPromises();
    await page.client.invalidateQueries();
    await flushPromises();
    expect(page.fetch.mock.calls).toEqual([["session"], ["policy"], ["policy"]]);
    page.permissionCodes.value = [];
    await flushPromises();
    await page.client.invalidateQueries();
    expect(page.tabs.activeTab.value).toBe("");
    expect(page.fetch).toHaveBeenCalledTimes(3);
    page.cleanup();
  });
  it("撤销当前权限后选择仍可访问的页签", async () => {
    const page = create(Object.values(actions));
    await flushPromises();
    page.permissionCodes.value = [SecurityAction.CONCURRENCY_READ];
    await flushPromises();
    expect(page.tabs.tabs.value).toEqual([{ id: "policy", title: "并发" }]);
    expect(page.tabs.activeTab.value).toBe("policy");
    page.cleanup();
  });
});
