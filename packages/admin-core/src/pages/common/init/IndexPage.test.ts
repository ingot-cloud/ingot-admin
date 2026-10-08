import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { useUserInfoStore } from "@/stores/modules/auth";
import { configureAdminRuntime, resetAdminRuntime } from "@/runtime";
import IndexPage from "./IndexPage.vue";

const mocks = vi.hoisted(() => ({
  put: vi.fn(),
  logout: vi.fn(),
  login: vi.fn(),
  warning: vi.fn(),
  success: vi.fn(),
}));

vi.mock("@/api/common/password", () => ({
  InitPwdAPI: mocks.put,
  FixPasswordAPI: vi.fn(),
  PasswordChangeStateAPI: vi.fn(),
}));
vi.mock("@/stores/modules/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/stores/modules/auth")>()),
  useAuthStore: () => ({ logout: mocks.logout }),
}));
vi.mock("@/hooks/biz/useLogin", () => ({ useLogin: () => ({ go: mocks.login }) }));
vi.mock("@/hooks/web/useMessage", () => ({
  useMessage: () => ({ warning: mocks.warning, success: mocks.success }),
  useMessageConfirm: () => ({ warning: vi.fn() }),
}));
vi.mock("@/hooks/biz/useGlobalLoading", () => ({ useGlobalLoading: () => ({ stop: vi.fn() }) }));
vi.mock("@/hooks/web/useRouter", () => ({ useGo: () => vi.fn() }));

const mountPage = () =>
  mount(IndexPage, {
    global: {
      stubs: {
        InAppBar: {
        props: { passwordChangeRequired: Boolean },
          template: '<div data-testid="header" :data-restricted="passwordChangeRequired" />',
        },
        InCopyright: true,
        InIcon: true,
      },
    },
  });

describe("强制改密表单", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    configureAdminRuntime({
      appCode: "test-admin",
      branding: { title: "管理后台" },
      login: { fingerprintEnabled: false },
      plugins: [],
    });
    useUserInfoStore().userInfo.mustChangePwd = true;
    vi.resetAllMocks();
    mocks.put.mockResolvedValue({ data: undefined });
    mocks.logout.mockResolvedValue(undefined);
    mocks.login.mockResolvedValue(undefined);
  });

  afterEach(resetAdminRuntime);

  it("空密码及确认不一致不调用改密，也不退出受限状态", async () => {
    const wrapper = mountPage();
    await wrapper.get("form").trigger("submit");
    await flushPromises();
    expect(mocks.put).not.toHaveBeenCalled();
    expect(wrapper.findAll(".el-form-item.is-error")).toHaveLength(2);
    const inputs = wrapper.findAll("input");
    await inputs[0]?.setValue("New-password-1");
    await inputs[1]?.setValue("New-password-2");
    await wrapper.get("form").trigger("submit");
    await flushPromises();
    expect(mocks.warning).toHaveBeenCalledWith("新密码不一致");
    expect(mocks.put).not.toHaveBeenCalled();
    expect(mocks.logout).not.toHaveBeenCalled();
    expect(useUserInfoStore().getIsInitPwd).toBe(true);
    wrapper.unmount();
  });

  it("提交期间不重复请求，改密成功等待会话清理后重新登录且不记忆 /init", async () => {
    let finishPassword!: () => void;
    let finishLogout!: () => void;
    mocks.put.mockImplementation(
      () =>
        new Promise((resolve) => {
          finishPassword = () => resolve({ data: undefined });
        }),
    );
    mocks.logout.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          useUserInfoStore().clear();
          finishLogout = resolve;
        }),
    );
    const wrapper = mountPage();
    const inputs = wrapper.findAll("input");
    for (const input of inputs) await input.setValue("New-password-1");
    expect(wrapper.get("button[type='submit']").text()).toBe("修改密码并重新登录");
    expect(inputs.every((input) => input.attributes("autocomplete") === "new-password")).toBe(true);
    await wrapper.get("form").trigger("submit");
    await flushPromises();
    expect(inputs.every((input) => input.attributes("disabled") !== undefined)).toBe(true);
    await wrapper.get("form").trigger("submit");
    await flushPromises();
    expect(mocks.put).toHaveBeenCalledOnce();
    expect(mocks.put).toHaveBeenCalledWith({
      newPassword: "New-password-1",
      confirmPassword: "New-password-1",
    });
    expect(mocks.logout).not.toHaveBeenCalled();
    finishPassword();
    await flushPromises();
    expect(mocks.logout).toHaveBeenCalledOnce();
    expect(mocks.login).not.toHaveBeenCalled();
    expect(wrapper.get("[data-testid='header']").attributes("data-restricted")).toBe("true");
    finishLogout();
    await flushPromises();
    expect(mocks.login).toHaveBeenCalledWith({ rememberReturnTo: false });
    expect(mocks.success).toHaveBeenCalledWith("密码设置成功，请使用新密码重新登录");
    wrapper.unmount();
  });

  it("服务端拒绝改密后保留输入与受限状态，允许修正后重试", async () => {
    mocks.put.mockRejectedValueOnce(new Error("密码不符合策略"));
    const wrapper = mountPage();
    const inputs = wrapper.findAll("input");
    for (const input of inputs) await input.setValue("New-password-1");
    await wrapper.get("form").trigger("submit");
    await flushPromises();
    expect(mocks.logout).not.toHaveBeenCalled();
    expect(mocks.login).not.toHaveBeenCalled();
    expect(useUserInfoStore().getIsInitPwd).toBe(true);
    expect(inputs.every((input) => input.attributes("disabled") === undefined)).toBe(true);
    expect(inputs.every((input) => input.element.value === "New-password-1")).toBe(true);
    await wrapper.get("form").trigger("submit");
    await flushPromises();
    expect(mocks.put).toHaveBeenCalledTimes(2);
    expect(mocks.login).toHaveBeenCalledOnce();
    wrapper.unmount();
  });
});
