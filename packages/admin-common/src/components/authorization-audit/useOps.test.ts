// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { QueryClient, VueQueryPlugin } from "@tanstack/vue-query";
import { usePermissions } from "@ingot/admin-core";
import { AuthorizationDomain, IamAction, AuditChangeType } from "../../models/iam/constants";
import type { AuditEntry } from "../../models/iam/types";
import { useOps } from "./useOps";

const { fetch } = vi.hoisted(() => ({ fetch: vi.fn() }));
import { createIamPageQueryOptions } from "../../api/iam/page-options";
import { createResourceQueryKeys } from "@ingot/admin-core";
// 会话由夹具控制；分页、Query Key、AbortSignal 与提交条件使用生产实现。
vi.mock("@ingot/admin-core", async () => {
  const { reactive, computed } = await import("vue");
  const state = reactive({
    domain: undefined as string | undefined,
    tenantId: null as string | null,
    memberId: "101",
    permissions: [] as string[],
    contextEpoch: 0,
    unavailable: false,
    markUnavailable() {
      this.unavailable = true;
    },
    bumpContextEpoch() {
      this.contextEpoch += 1;
    },
  });
  return {
    usePermissions: () => state,
    useCapabilities: () => ({
      unavailable: computed(() => state.unavailable),
      contextEpoch: computed(() => state.contextEpoch),
      hasAction: (code: string) => !state.unavailable && state.permissions.includes(code),
    }),
    ...(await import("../../../../admin-core/src/query/paging")),
    ...(await import("../../../../admin-core/src/query/keys")),
    ...(await import("../../../../admin-core/src/query/page-options")),
    ...(await import("../../../../admin-core/src/query/request")),
    ...(await import("../../../../admin-core/src/query/snapshot")),
    ...(await import("../../../../admin-core/src/components/select/pickerFilter")),
  };
});
const entry: AuditEntry = {
  id: "9",
  actor: { accountId: "1", memberId: "101" },
  context: { domain: AuthorizationDomain.PLATFORM, accountId: "1", memberId: "101" },
  target: { resource: "resource", id: "88" },
  changeType: AuditChangeType.UPDATE,
  before: {},
  after: { FIELD_CAPABILITIES: "[]" },
  revisions: { resource: "1" },
  timestamp: "2026-10-11T01:00:00Z",
};
let cleanup = () => {};
beforeEach(() => {
  fetch.mockReset();
  fetch.mockResolvedValue({ data: { current: 1, size: 20, total: 0, records: [] } });
});
afterEach(() => cleanup());

const create = (
  domain = AuthorizationDomain.PLATFORM,
  actions: string[] = [IamAction.PLATFORM_AUDIT_READ],
) => {
  const permissions = usePermissions();
  permissions.domain = domain;
  permissions.unavailable = false;
  permissions.contextEpoch = 0;
  permissions.memberId = "101";
  permissions.tenantId = domain === AuthorizationDomain.TENANT ? "10" : null;
  permissions.permissions = actions;
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  let ops: ReturnType<typeof useOps> | undefined;
  const wrapper = mount(
    defineComponent({
      setup() {
        ops = useOps({
          domain,
          readAction:
            domain === AuthorizationDomain.PLATFORM
              ? IamAction.PLATFORM_AUDIT_READ
              : IamAction.TENANT_AUDIT_READ,
          queryOptions: createIamPageQueryOptions(
            createResourceQueryKeys("audit-test", "audit"),
            (page, condition, options) => fetch(domain, page, condition, options),
          ),
        });
        return () => h("div");
      },
    }),
    {
      global: { plugins: [[VueQueryPlugin, { queryClient }]] },
    },
  );
  cleanup = () => {
    wrapper.unmount();
    queryClient.clear();
  };
  if (!ops) throw new Error("页面未初始化");
  return { ops, permissions };
};

describe("授权审计查询状态", () => {
  it("平台默认查询平台；租户固定查询当前租户域", async () => {
    const { ops } = create(AuthorizationDomain.TENANT, [IamAction.TENANT_AUDIT_READ]);
    await flushPromises();
    expect(fetch).toHaveBeenCalledWith(
      AuthorizationDomain.TENANT,
      { current: 1, size: 20 },
      {},
      expect.any(Object),
    );
    expect(ops.title.value).toBe("当前组织授权审计");
    expect(ops.feedback.value).toBe("empty");
  });
  it("无审计读资格不请求；无权限与授权不可用分别展示", async () => {
    const { ops, permissions } = create(AuthorizationDomain.PLATFORM, []);
    await flushPromises();
    expect(fetch).not.toHaveBeenCalled();
    expect(ops.feedback.value).toBe("unauthorized");
    permissions.markUnavailable();
    await flushPromises();
    expect(ops.feedback.value).toBe("error");
  });
  it("服务器拒绝和错误不显示为暂无数据", async () => {
    fetch.mockRejectedValue(Object.assign(new Error("没有权限"), { code: "ActionDenied" }));
    const { ops } = create();
    await flushPromises();
    expect(ops.feedback.value).toBe("unauthorized");
    fetch.mockRejectedValue(Object.assign(new Error("读取失败"), { code: "S0500" }));
    await ops.paging.query.refetch();
    await flushPromises();
    expect(ops.feedback.value).toBe("error");
  });
  it("时间筛选转 UTC 并重置页码；重置额外筛选保留主搜索", async () => {
    const { ops } = create();
    await flushPromises();
    ops.paging.fetchData({ type: "current", value: 3 });
    await flushPromises();
    ops.paging.condition.actorMemberId = "101";
    ops.timeRange.value = [
      new Date("2026-10-11T09:00:00+08:00"),
      new Date("2026-10-11T10:00:00+08:00"),
    ];
    await flushPromises();
    expect(fetch).toHaveBeenLastCalledWith(
      AuthorizationDomain.PLATFORM,
      { current: 1, size: 20 },
      {
        actorMemberId: "101",
        from: "2026-10-11T01:00:00.000Z",
        until: "2026-10-11T02:00:00.000Z",
      },
      expect.any(Object),
    );
    expect(ops.feedback.value).toBe("no-result");
    ops.resetExtraFilters();
    await flushPromises();
    expect(ops.paging.condition.actorMemberId).toBe("101");
    expect(ops.paging.condition.from).toBeUndefined();
  });
  it("身份变化或撤权时清除已打开审计详情", async () => {
    const { ops, permissions } = create();
    await flushPromises();
    ops.openDetail({ record: entry, version: "9" });
    expect(ops.detailVisible.value).toBe(true);
    permissions.bumpContextEpoch();
    await flushPromises();
    expect(ops.detail.value).toBeUndefined();
    expect(ops.detailVisible.value).toBe(false);
    ops.openDetail({ record: entry, version: "9" });
    permissions.permissions = [];
    await flushPromises();
    expect(ops.detail.value).toBeUndefined();
    expect(ops.pageInfo.value.records).toEqual([]);
  });
});
