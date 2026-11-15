// @vitest-environment jsdom
import { defineComponent, h } from "vue";
import { mount, flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  rememberSessionContext,
  clearSessionContext,
  type AuthSession,
  type OrganizationPage,
} from "@ingot/auth-core";
import { AUTH_SESSION_KEY } from "../../session";
import { useOps } from "./useOps";

vi.mock("../../appearance", () => ({ useAuthAppearance: vi.fn() }));
const state = vi.hoisted(() => ({
  query: vi.fn(),
  returnCurrent: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  create: vi.fn(),
  pending: vi.fn(),
  me: vi.fn(),
}));
const response = (overrides?: Partial<OrganizationPage>): OrganizationPage => ({
  currentTenant: { id: "42", name: "当前组织" },
  currentTenantAccessible: true,
  records: [],
  total: 0,
  switchableTotal: 0,
  page: 1,
  pageSize: 20,
  ...overrides,
});
const session = () =>
  ({
    colorScheme: "light",
    api: { queryOrganizations: state.query, createOrganizationSwitch: state.create, me: state.me },
    warn: state.warn,
    error: state.error,
    organizationSwitch: {
      returnToCurrent: state.returnCurrent,
      pending: state.pending,
      requireLogin: vi.fn(),
      logout: vi.fn(),
    },
  }) as unknown as AuthSession;
let ops: ReturnType<typeof useOps>;
const setup = async () => {
  const wrapper = mount(
    defineComponent({
      setup() {
        ops = useOps();
        return () => h("div");
      },
    }),
    {
      global: { provide: { [AUTH_SESSION_KEY as symbol]: session() } },
    },
  );
  await flushPromises();
  return wrapper;
};
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  state.returnCurrent.mockResolvedValue(undefined);
  rememberSessionContext({
    appId: "tenant-admin",
    domain: "TENANT",
    tenantId: "42",
    userId: 1,
    clientId: "client",
    contextVersion: "source-version",
  });
});

describe("organization picker", () => {
  it("没有其他组织时友好提示并返回当前组织，不创建切换事务", async () => {
    state.query.mockResolvedValue({ data: response() });
    const wrapper = await setup();
    expect(state.warn).toHaveBeenCalledWith("当前没有其他可切换的组织，已返回当前组织");
    expect(state.returnCurrent).toHaveBeenCalledExactlyOnceWith(true);
    expect(state.create).not.toHaveBeenCalled();
    expect(state.pending).not.toHaveBeenCalled();
    wrapper.unmount();
  });
  it("原组织也失效时返回安全状态，不恢复原权限", async () => {
    state.query.mockResolvedValue({ data: response({ currentTenantAccessible: false }) });
    const wrapper = await setup();
    expect(state.warn).toHaveBeenCalledWith("当前组织不可访问，且暂无其他可切换组织");
    expect(state.returnCurrent).toHaveBeenCalledWith(false);
    wrapper.unmount();
  });
  it("搜索零匹配但仍有候选时留在选择页", async () => {
    state.query.mockResolvedValue({ data: response({ switchableTotal: 2 }) });
    const wrapper = await setup();
    expect(state.returnCurrent).not.toHaveBeenCalled();
    expect(ops.data.value?.records).toEqual([]);
    wrapper.unmount();
  });
  it("依赖故障显示重试，不伪装成零候选返回", async () => {
    state.query.mockRejectedValue(Object.assign(new Error("认证服务暂不可用"), { status: 503 }));
    const wrapper = await setup();
    expect(state.returnCurrent).not.toHaveBeenCalled();
    expect(ops.errorText.value).toContain("暂不可用");
    wrapper.unmount();
  });
  it("首屏 me 故障留在可重试状态，不带缺失版本去查询候选", async () => {
    clearSessionContext();
    state.me.mockRejectedValue(Object.assign(new Error("认证服务暂不可用"), { status: 503 }));
    const wrapper = await setup();
    expect(state.query).not.toHaveBeenCalled();
    expect(state.returnCurrent).not.toHaveBeenCalled();
    expect(ops.errorText.value).toContain("暂不可用");
    wrapper.unmount();
  });
});
