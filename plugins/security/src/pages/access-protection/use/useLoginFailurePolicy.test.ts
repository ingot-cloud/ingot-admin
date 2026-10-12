import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, inject, ref, type Ref } from "vue";
import { mount, flushPromises } from "@vue/test-utils";
import { QueryClient, VueQueryPlugin } from "@tanstack/vue-query";
import { useSecurityTabs, SecurityAction } from "@/hooks/useSecurityTabs";
import { useLoginFailurePolicy } from "./useLoginFailurePolicy";

const api = vi.hoisted(() => ({ read: vi.fn(), save: vi.fn() }));
vi.mock("@/api/security/context", () => ({
  securityQueryContext: () => ({ identity: "test", epoch: 1 }),
}));
vi.mock("@/api/security/loginFailurePolicy", () => ({
  GetLoginFailurePolicyByDimensionAPI: api.read,
  UpdateLoginFailurePolicyAPI: api.save,
}));
vi.mock("@ingot/admin-core", () => ({
  createResourceQueryKeys: (scope: string, resource: string) => ({
    detail: (id: string) => [scope, resource, "detail", id],
    lists: () => [scope, resource, "list"],
  }),
  silentQueryRequest: (signal?: AbortSignal) => ({ signal }),
  useCapabilities: () => {
    const codes = inject<Ref<string[]>>("codes")!;
    return { hasAction: (code: string) => codes.value.includes(code) };
  },
  useMessage: () => ({ success: vi.fn() }),
}));
function create() {
  const codes = ref([SecurityAction.LOGIN_READ]);
  const dimension = ref("IP");
  let tabs!: ReturnType<typeof useSecurityTabs>;
  let policy!: ReturnType<typeof useLoginFailurePolicy>;
  const panel = defineComponent({
    setup() {
      policy = useLoginFailurePolicy(dimension);
      return () => h("div");
    },
  });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const root = defineComponent({
    setup() {
      tabs = useSecurityTabs(
        [
          { value: "login-failure", label: "登录失败" },
          { value: "other", label: "其他" },
        ],
        { "login-failure": SecurityAction.LOGIN_READ, other: SecurityAction.LOGIN_READ },
      );
      return () => h(panel);
    },
  });
  const wrapper = mount(root, {
    global: { provide: { codes }, plugins: [[VueQueryPlugin, { queryClient: client }]] },
  });
  return {
    codes,
    dimension,
    client,
    get tabs() {
      return tabs;
    },
    get policy() {
      return policy;
    },
    cleanup() {
      wrapper.unmount();
      client.clear();
    },
  };
}
beforeEach(() => {
  api.read
    .mockReset()
    .mockImplementation(async (dimension: string) => ({ data: { dimension, enabled: true } }));
  api.save.mockReset().mockResolvedValue({ data: null });
});
describe("登录失败防护维度的实际请求", () => {
  it("只查询激活维度，切走后失效不请求，重新激活读取当前维度", async () => {
    const page = create();
    await flushPromises();
    expect(api.read.mock.calls.map(([dimension]) => dimension)).toEqual(["IP"]);
    page.dimension.value = "DEVICE";
    await flushPromises();
    expect(page.policy.policyMap.value.DEVICE?.dimension).toBe("DEVICE");
    page.tabs.activeTab.value = "other";
    await flushPromises();
    page.dimension.value = "CLIENT";
    await page.client.invalidateQueries();
    await flushPromises();
    expect(api.read.mock.calls.map(([dimension]) => dimension)).toEqual(["IP", "DEVICE"]);
    page.tabs.activeTab.value = "login-failure";
    await flushPromises();
    expect(api.read.mock.calls.map(([dimension]) => dimension)).toEqual(["IP", "DEVICE", "CLIENT"]);
    page.codes.value = [];
    await flushPromises();
    await page.client.invalidateQueries();
    expect(api.read).toHaveBeenCalledTimes(3);
    page.cleanup();
  });
  it("保存只刷新对应维度一次；空配置合法且不会引起 Query undefined 错误", async () => {
    const page = create();
    await flushPromises();
    await page.policy.savePolicy({ dimension: "IP", enabled: true });
    await flushPromises();
    expect(api.read).toHaveBeenCalledTimes(2);
    expect(api.save).toHaveBeenCalledTimes(1);
    api.read.mockResolvedValueOnce({ data: null });
    page.dimension.value = "ACCOUNT_IP";
    await flushPromises();
    expect(page.policy.policyMap.value.ACCOUNT_IP).toBeUndefined();
    expect(page.client.getQueryCache().getAll().at(-1)?.state.status).toBe("success");
    page.cleanup();
  });
});
