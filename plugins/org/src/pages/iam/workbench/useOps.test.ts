import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent, reactive } from "vue";
import { QueryClient, VueQueryPlugin } from "@tanstack/vue-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { refreshSessionPermissions } from "@ingot/admin-core";
import { TenantWorkbenchStatisticsAPI } from "@/api/iam/workbench";
import { useOps } from "./useOps";

const state = vi.hoisted(() => ({ permissions: {} as Record<string, unknown> }));
vi.mock("@ingot/admin-core", () => ({
  REALTIME_QUERY_STALE_TIME: 0,
  refreshSessionPermissions: vi.fn(),
  silentQueryRequest: (signal: AbortSignal) => ({ signal }),
  usePermissions: () => state.permissions,
  useRouterStore: () => ({ getMenus: [] }),
}));
vi.mock("vue-router", () => ({ useRoute: () => ({ path: "/workbench" }) }));
vi.mock("@/api/iam/workbench", () => ({ TenantWorkbenchStatisticsAPI: vi.fn() }));

beforeEach(() => {
  vi.resetAllMocks();
  state.permissions = reactive({
    domain: "TENANT",
    tenantId: "10",
    memberId: "101",
    version: "1",
    contextEpoch: 0,
    unavailable: false,
  });
});

describe("工作台统计上下文", () => {
  it("权限不可用时暂停统计，重新加载先恢复授权后再查询", async () => {
    state.permissions.unavailable = true;
    vi.mocked(TenantWorkbenchStatisticsAPI).mockResolvedValue({
      data: { tenantId: "10", tenantName: "当前组织", applicationCount: 1 },
    });
    let ops: ReturnType<typeof useOps> | undefined;
    const component = defineComponent({
      setup() {
        ops = useOps();
        return () => null;
      },
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = mount(component, {
      global: { plugins: [[VueQueryPlugin, { queryClient: client }]] },
    });
    await flushPromises();
    expect(TenantWorkbenchStatisticsAPI).not.toHaveBeenCalled();
    vi.mocked(refreshSessionPermissions).mockRejectedValueOnce(new Error("权限服务不可用"));
    await ops?.retry();
    expect(ops?.failed.value).toBe(true);
    expect(TenantWorkbenchStatisticsAPI).not.toHaveBeenCalled();
    vi.mocked(refreshSessionPermissions).mockImplementationOnce(async () => {
      state.permissions.unavailable = false;
    });
    await ops?.retry();
    await flushPromises();
    expect(ops?.statistics.value?.tenantName).toBe("当前组织");
    expect(ops?.failed.value).toBe(false);
    wrapper.unmount();
    client.clear();
  });

  it("切换租户后立即清除旧数据，晚到的旧响应不会覆盖新上下文", async () => {
    let completeOld:
      ((value: Awaited<ReturnType<typeof TenantWorkbenchStatisticsAPI>>) => void) | undefined;
    vi.mocked(TenantWorkbenchStatisticsAPI)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            completeOld = resolve;
          }),
      )
      .mockResolvedValueOnce({
        data: { tenantId: "20", tenantName: "新组织", applicationCount: 1 },
      });
    let ops: ReturnType<typeof useOps> | undefined;
    const component = defineComponent({
      setup() {
        ops = useOps();
        return () => null;
      },
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = mount(component, {
      global: { plugins: [[VueQueryPlugin, { queryClient: client }]] },
    });
    await flushPromises();
    state.permissions.tenantId = "20";
    await flushPromises();
    expect(ops?.statistics.value?.tenantName).toBe("新组织");
    completeOld?.({ data: { tenantId: "10", tenantName: "旧组织", applicationCount: 9 } });
    await flushPromises();
    expect(ops?.statistics.value?.tenantName).toBe("新组织");
    state.permissions.unavailable = true;
    await flushPromises();
    expect(ops?.statistics.value).toBeUndefined();
    expect(ops?.failed.value).toBe(true);
    wrapper.unmount();
    client.clear();
  });
});
