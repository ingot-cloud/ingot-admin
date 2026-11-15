import { onBeforeUnmount, onMounted, ref } from "vue";
import { ElMessageBox } from "element-plus";
import {
  createOrganizationSwitchFlow,
  OrganizationSwitchPendingError,
  readOrganizationSync,
  hasPendingOrganizationSwitch,
  currentSessionContext,
  type OrganizationPage,
  type OrganizationSummary,
  type OrganizationSwitchView,
  type SessionMe,
} from "@ingot/auth-core";
import { useAuthSession } from "../../session";
import { useAuthAppearance } from "../../appearance";

const NO_ORGANIZATIONS = "当前没有其他可切换的组织，已返回当前组织";
const CURRENT_UNAVAILABLE = "当前组织不可访问，且暂无其他可切换组织";
const isStatus = (error: unknown, status: number): boolean =>
  typeof error === "object" && error !== null && "status" in error && error.status === status;
const isCode = (error: unknown, code: string): boolean =>
  typeof error === "object" && error !== null && "code" in error && error.code === code;

export const useOps = () => {
  const session = useAuthSession();
  const host = session.organizationSwitch;
  useAuthAppearance(session.colorScheme);
  const loading = ref(true);
  const submitting = ref(false);
  const keyword = ref("");
  const page = ref(1);
  const data = ref<OrganizationPage>();
  const errorText = ref("");
  const recovering = ref(false);
  const bootstrapPending = ref(false);
  let disposed = false;
  let loadVersion = 0;
  let completed: { view: OrganizationSwitchView; identity: SessionMe } | undefined;
  const flow = createOrganizationSwitchFlow(session.api, {
    storage: typeof sessionStorage === "undefined" ? undefined : sessionStorage,
    onPending: (view, sourceVersion) => {
      if (!disposed) host?.pending(view, sourceVersion);
    },
  });
  const report = (error: unknown): void => {
    errorText.value = error instanceof Error ? error.message : "暂时无法加载组织，请稍后重试";
    session.error(errorText.value);
  };
  const requireLogin = async (error: unknown): Promise<boolean> => {
    if (isStatus(error, 401) || isCode(error, "PasswordChangeRequired")) {
      await host?.requireLogin();
      return true;
    }
    return false;
  };
  const load = async (): Promise<void> => {
    if (!host) {
      errorText.value = "当前管理台不支持组织切换";
      loading.value = false;
      return;
    }
    const version = ++loadVersion;
    loading.value = true;
    errorText.value = "";
    try {
      if (!currentSessionContext()) await session.api.me();
      const result = (
        await session.api.queryOrganizations({
          page: page.value,
          pageSize: 20,
          keyword: keyword.value,
        })
      ).data;
      if (disposed || version !== loadVersion) return;
      data.value = result;
      if (result.switchableTotal === 0) {
        session.warn(result.currentTenantAccessible ? NO_ORGANIZATIONS : CURRENT_UNAVAILABLE);
        await host.returnToCurrent(result.currentTenantAccessible);
      }
    } catch (error) {
      if (!disposed && !(await requireLogin(error))) report(error);
    } finally {
      if (!disposed && version === loadVersion) loading.value = false;
    }
  };
  const finish = async (result: {
    view: OrganizationSwitchView;
    identity: SessionMe;
  }): Promise<void> => {
    completed = result;
    bootstrapPending.value = true;
    await host?.completed(result.view, result.identity);
    bootstrapPending.value = false;
  };
  const recover = async (): Promise<void> => {
    recovering.value = true;
    loading.value = true;
    errorText.value = "";
    try {
      const shared = readOrganizationSync();
      const result = await flow.restore(flow.hasPending() ? undefined : shared?.transactionId);
      if (result) await finish(result);
      else {
        recovering.value = false;
        await load();
      }
    } catch (error) {
      if (await requireLogin(error)) return;
      report(error);
      if (
        !(error instanceof OrganizationSwitchPendingError) &&
        !bootstrapPending.value &&
        !isStatus(error, 503)
      ) {
        flow.forget();
        recovering.value = false;
        await host?.failed();
        await load();
      }
    } finally {
      if (!disposed) loading.value = false;
    }
  };
  const select = async (item: OrganizationSummary): Promise<void> => {
    if (submitting.value || loading.value || !host) return;
    try {
      await ElMessageBox.confirm(
        "切换后，同源租户管理标签页都会进入目标组织首页，未保存的内容将被清理。",
        "切换组织",
        {
          confirmButtonText: "切换组织",
          cancelButtonText: "取消",
          type: "warning",
        },
      );
    } catch {
      return;
    }
    if (disposed) return;
    submitting.value = true;
    errorText.value = "";
    try {
      await finish(await flow.start(item.id));
    } catch (error) {
      if (disposed) return;
      if (await requireLogin(error)) return;
      report(error);
      if (error instanceof OrganizationSwitchPendingError || bootstrapPending.value)
        recovering.value = true;
      else {
        flow.forget();
        await host.failed();
        await load();
      }
    } finally {
      if (!disposed) submitting.value = false;
    }
  };
  const retry = async (): Promise<void> => {
    if (bootstrapPending.value && completed) {
      loading.value = true;
      try {
        await finish(completed);
      } catch (error) {
        report(error);
      } finally {
        loading.value = false;
      }
    } else if (recovering.value || flow.hasPending()) await recover();
    else await load();
  };
  const search = (): void => {
    page.value = 1;
    void load();
  };
  const changePage = (value: number): void => {
    page.value = value;
    void load();
  };
  const back = (): Promise<void> =>
    host?.returnToCurrent(data.value?.currentTenantAccessible ?? true) ?? Promise.resolve();
  const logout = (): Promise<void> => host?.logout() ?? Promise.resolve();
  onMounted(() => {
    if (flow.hasPending() || hasPendingOrganizationSwitch()) void recover();
    else void load();
  });
  onBeforeUnmount(() => {
    disposed = true;
    loadVersion += 1;
  });
  return {
    loading,
    submitting,
    keyword,
    page,
    data,
    errorText,
    recovering,
    bootstrapPending,
    select,
    retry,
    search,
    changePage,
    back,
    logout,
  };
};
