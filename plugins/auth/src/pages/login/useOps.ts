import { onBeforeUnmount, onMounted, ref } from "vue";
import {
  consumeExplicitLogout,
  EXPLICIT_LOGOUT_QUERY_KEY,
  createLoginFlow,
  isPreparationFailure,
  isUncertainLogin,
  LoginRecoveryPendingError,
  type LoginResult,
  type TenantCandidate,
} from "@ingot/auth-core";
import { useAuthSession } from "../../session";
import { useAuthAppearance } from "../../appearance";

/** 页面只编排共享认证流，密码由表单组件临时持有。 */
export function useOps() {
  const session = useAuthSession();
  useAuthAppearance(session.colorScheme);
  let storage: Storage | undefined;
  try {
    storage = sessionStorage;
  } catch {
    /* 禁止存储时仍允许显示登录与明确错误。 */
  }
  const flow = createLoginFlow(session.api, {
    appId: session.appId,
    entry: session.entry,
    storage,
  });
  const restoring = ref(false);
  const candidates = ref<TenantCandidate[]>([]);
  const recoverable = ref(false);
  let mounted = true;
  onBeforeUnmount(() => {
    mounted = false;
  });
  const report = (error: unknown): void => {
    if (!mounted) return;
    if (isPreparationFailure(error)) {
      candidates.value = [];
      recoverable.value = false;
      flow.reset();
    } else if (
      flow.transaction() &&
      (isUncertainLogin(error) || error instanceof LoginRecoveryPendingError)
    ) {
      recoverable.value = true;
    }
    session.error(error instanceof Error && error.message ? error.message : "暂时无法登录，请重试");
  };
  let finishing: Promise<void> | undefined;
  const finish = async (result: LoginResult): Promise<void> => {
    if (!mounted) return;
    if (result.stage === "SELECT_TENANT") {
      candidates.value = result.allows;
      recoverable.value = false;
      return;
    }
    restoring.value = true;
    try {
      const identity = await flow.confirm(result);
      if (!mounted) return;
      await session.onAuthenticated(result, identity);
      flow.reset();
      recoverable.value = false;
    } catch (error) {
      recoverable.value = Boolean(flow.transaction());
      report(error);
    } finally {
      restoring.value = false;
    }
  };
  const success = (result: LoginResult): Promise<void> => {
    if (finishing) return finishing;
    finishing = finish(result).finally(() => {
      finishing = undefined;
    });
    return finishing;
  };
  const submit = async (username: string, password: string): Promise<LoginResult> => {
    recoverable.value = false;
    try {
      return await flow.submit(username, password);
    } catch (error) {
      report(error);
      throw error;
    }
  };
  const select = async (tenantId: string): Promise<LoginResult> => {
    try {
      return await flow.select(tenantId);
    } catch (error) {
      report(error);
      throw error;
    }
  };
  const back = (): void => {
    candidates.value = [];
    recoverable.value = false;
    flow.reset();
  };
  const restore = async (): Promise<boolean> => {
    const state = await flow.restore();
    if (!mounted) return false;
    if (state?.stage === "SELECT_TENANT" || state?.stage === "COMPLETED") {
      await success(state);
      return true;
    }
    return false;
  };
  const retry = async (): Promise<void> => {
    if (restoring.value) return;
    restoring.value = true;
    try {
      if (!(await restore())) back();
    } catch (error) {
      report(error);
    } finally {
      restoring.value = false;
    }
  };
  onMounted(async () => {
    // URL参数从不导入认证结果；旧书签只得到当前origin的稳定表单。
    const explicit = new URLSearchParams(location.search).get(EXPLICIT_LOGOUT_QUERY_KEY) === "1";
    if (location.search || location.hash)
      history.replaceState(history.state, "", location.pathname);
    if (consumeExplicitLogout(undefined, session.appId) || explicit) {
      flow.reset();
      return;
    }
    restoring.value = true;
    try {
      if (!(await restore()) && mounted) await session.onExistingSession();
    } catch (error) {
      report(error);
    } finally {
      restoring.value = false;
    }
  });
  return { restoring, candidates, recoverable, submit, select, success, back, retry };
}
