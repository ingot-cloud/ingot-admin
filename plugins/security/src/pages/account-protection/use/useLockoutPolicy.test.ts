import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, inject, ref, type Ref } from "vue";
import { mount, flushPromises } from "@vue/test-utils";
import { QueryClient, VueQueryPlugin } from "@tanstack/vue-query";
import { useSecurityTabs, SecurityAction } from "@/hooks/useSecurityTabs";
import { AccountProtectionTabEnum } from "@/models/enums/accountProtectionEnums";
import { SessionUserTypeEnum } from "@/models/enums/sessionEnums";
import { accountLockoutPolicyQueryKeys } from "@/api/security/accountLockoutPolicy.query";
import { useLockoutPolicy } from "./useLockoutPolicy";

const api = vi.hoisted(() => ({ read: vi.fn(), save: vi.fn() }));
vi.mock("@/api/security/context", () => ({
  securityQueryContext: () => ({ identity: "test", epoch: 1 }),
}));
vi.mock("@/api/security/accountLockoutPolicy", () => ({
  GetAccountLockoutPolicyByUserTypeAPI: api.read,
  GetAccountLockoutPoliciesAPI: vi.fn(),
  UpdateAccountLockoutPolicyAPI: api.save,
}));
vi.mock("@ingot/admin-core", () => ({
  newEnumExt: (value: string, label: string) => ({ value, label }),
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
  const codes = ref([SecurityAction.LOCKOUT_READ]);
  let tabs!: ReturnType<typeof useSecurityTabs>;
  const policies: Partial<Record<SessionUserTypeEnum, ReturnType<typeof useLockoutPolicy>>> = {};
  const makePanel = (userType: SessionUserTypeEnum, tab: AccountProtectionTabEnum) =>
    defineComponent({
      setup() {
        policies[userType] = useLockoutPolicy(userType, tab);
        return () => h("div");
      },
    });
  const admin = makePanel(SessionUserTypeEnum.ADMIN, AccountProtectionTabEnum.ADMIN_LOCKOUT);
  const app = makePanel(SessionUserTypeEnum.APP, AccountProtectionTabEnum.APP_LOCKOUT);
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  const root = defineComponent({
    setup() {
      tabs = useSecurityTabs(
        [
          { value: AccountProtectionTabEnum.ADMIN_LOCKOUT, label: "B 端锁定策略" },
          { value: AccountProtectionTabEnum.APP_LOCKOUT, label: "C 端锁定策略" },
        ],
        {
          [AccountProtectionTabEnum.ADMIN_LOCKOUT]: SecurityAction.LOCKOUT_READ,
          [AccountProtectionTabEnum.APP_LOCKOUT]: SecurityAction.LOCKOUT_READ,
        },
      );
      return () =>
        h("div", [
          tabs.visitedTabs.value[AccountProtectionTabEnum.ADMIN_LOCKOUT] ? h(admin) : null,
          tabs.visitedTabs.value[AccountProtectionTabEnum.APP_LOCKOUT] ? h(app) : null,
        ]);
    },
  });
  const wrapper = mount(root, {
    global: { provide: { codes }, plugins: [[VueQueryPlugin, { queryClient: client }]] },
  });
  return {
    codes,
    client,
    policies,
    get tabs() {
      return tabs;
    },
    cleanup() {
      wrapper.unmount();
      client.clear();
    },
  };
}

beforeEach(() => {
  api.read.mockReset().mockImplementation(async (userType: string) => ({
    data: {
      userType,
      enabled: true,
      maxAttempts: 5,
      lockDurationMinutes: 30,
      attemptWindowMinutes: 15,
      hintAfterAttempts: 3,
    },
  }));
  api.save.mockReset().mockResolvedValue({ data: null });
});

describe("账号保护两端 Tab 请求", () => {
  it("默认仅读取 B 端，首次切换再读 C 端，隐藏失效与撤权不请求", async () => {
    const page = create();
    await flushPromises();
    expect(api.read.mock.calls.map(([userType]) => userType)).toEqual(["0"]);
    expect(page.policies[SessionUserTypeEnum.APP]).toBeUndefined();
    page.tabs.activeTab.value = AccountProtectionTabEnum.APP_LOCKOUT;
    await flushPromises();
    expect(api.read.mock.calls.map(([userType]) => userType)).toEqual(["0", "1"]);
    await page.client.invalidateQueries({ queryKey: accountLockoutPolicyQueryKeys.detail("0") });
    await flushPromises();
    expect(api.read).toHaveBeenCalledTimes(2);
    page.tabs.activeTab.value = AccountProtectionTabEnum.ADMIN_LOCKOUT;
    await flushPromises();
    expect(api.read.mock.calls.map(([userType]) => userType)).toEqual(["0", "1", "0"]);
    page.codes.value = [];
    await flushPromises();
    await page.client.invalidateQueries();
    await page.policies[SessionUserTypeEnum.ADMIN]!.loadAll();
    expect(api.read).toHaveBeenCalledTimes(3);
    page.cleanup();
  });

  it("保存 C 端仅刷新 C 端一次，B 端缓存与策略隔离", async () => {
    const page = create();
    await flushPromises();
    page.tabs.activeTab.value = AccountProtectionTabEnum.APP_LOCKOUT;
    await flushPromises();
    const policy = page.policies[SessionUserTypeEnum.APP]!;
    await policy.savePolicy({ ...policy.config.value!, maxAttempts: 9 });
    await flushPromises();
    expect(api.read.mock.calls.map(([userType]) => userType)).toEqual(["0", "1", "1"]);
    expect(api.save.mock.calls[0]![0]).toMatchObject({ userType: "1", maxAttempts: 9 });
    expect(page.policies[SessionUserTypeEnum.ADMIN]!.config.value?.maxAttempts).toBe(5);
    page.tabs.activeTab.value = AccountProtectionTabEnum.ADMIN_LOCKOUT;
    await flushPromises();
    expect(api.read).toHaveBeenCalledTimes(3);
    page.cleanup();
  });

  it("空配置保持合法空态，保存失败不失效或重复请求", async () => {
    api.read.mockResolvedValueOnce({ data: null });
    const page = create();
    await flushPromises();
    expect(page.policies[SessionUserTypeEnum.ADMIN]!.config.value).toBeUndefined();
    expect(page.client.getQueryCache().getAll()[0]!.state.status).toBe("success");
    page.tabs.activeTab.value = AccountProtectionTabEnum.APP_LOCKOUT;
    await flushPromises();
    api.save.mockRejectedValueOnce(new Error("保存失败"));
    const policy = page.policies[SessionUserTypeEnum.APP]!;
    await expect(policy.savePolicy(policy.config.value!)).rejects.toThrow("保存失败");
    expect(api.read).toHaveBeenCalledTimes(2);
    expect(policy.saving.value).toBe(false);
    page.cleanup();
  });
});
