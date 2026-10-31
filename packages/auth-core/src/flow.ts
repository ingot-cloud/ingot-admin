import type { AuthApi } from "./api";
import { clearCsrfToken } from "./csrf";
import {
  BFF_CSRF_INVALID,
  LoginRecoveryPendingError,
  errorCode,
  isPreparationFailure,
  isUncertainLogin,
} from "./errors";
import type {
  AuthEntry,
  CompletedLoginResult,
  LoginResult,
  SessionMe,
  TransactionView,
} from "./types";

const WAIT_MILLIS = 1000;
const MAX_POLLS = 15;
const MAX_RECOVERY_MILLIS = 15_000;
export interface LoginFlowOptions {
  appId: string;
  entry: AuthEntry;
  storage?: Pick<Storage, "getItem" | "setItem" | "removeItem">;
  wait?: (millis: number) => Promise<void>;
  now?: () => number;
}
/** 每标签页只持久化不透明事务线索；服务端仍是归属和身份的唯一权威。 */
export const createLoginFlow = (api: AuthApi, options: LoginFlowOptions) => {
  const key = `ingot.auth.${options.appId}.transaction`;
  let transactionId: string | undefined;
  let active: Promise<LoginResult> | undefined;
  let selecting: Promise<LoginResult> | undefined;
  let restoring: Promise<TransactionView | null> | undefined;
  let confirming: Promise<SessionMe> | undefined;
  let confirmingId: string | undefined;
  let completedRead: CompletedLoginResult | undefined;
  const wait =
    options.wait ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  const remember = (id?: string): void => {
    transactionId = id;
    try {
      if (id) options.storage?.setItem(key, id);
      else options.storage?.removeItem(key);
    } catch {
      /* 隐私模式仍可在本页完成。 */
    }
  };
  const stored = (): string | undefined => {
    try {
      return transactionId ?? options.storage?.getItem(key) ?? undefined;
    } catch {
      return transactionId;
    }
  };
  const now = options.now ?? (() => performance.now());
  const recover = async (id: string): Promise<TransactionView> => {
    const deadline = now() + MAX_RECOVERY_MILLIS;
    for (let poll = 0; poll < MAX_POLLS; poll += 1) {
      const remaining = deadline - now();
      if (remaining <= 0) break;
      const result = (await api.readTransaction(id, Math.max(1, Math.floor(remaining)))).data;
      if (!["AUTHENTICATING", "COMMITTING", "UNKNOWN"].includes(result.stage)) {
        completedRead = result.stage === "COMPLETED" ? result : undefined;
        return result;
      }
      if (poll + 1 < MAX_POLLS) await wait(Math.max(0, Math.min(WAIT_MILLIS, deadline - now())));
    }
    throw new LoginRecoveryPendingError("登录结果暂未确认，请稍后重试，系统不会重复提交密码");
  };
  const submit = (username: string, password: string): Promise<LoginResult> => {
    if (active) return active;
    const attempt = async (): Promise<LoginResult> => {
      for (let prepare = 0; prepare < 2; prepare += 1) {
        let id: string | undefined;
        let submitted = false;
        try {
          const created = await api.createTransaction();
          id = created.data.transactionId;
          remember(id);
          submitted = true;
          return (await api.login(username, password, id)).data;
        } catch (error) {
          if (prepare === 0 && !submitted && isPreparationFailure(error)) {
            clearCsrfToken(options.entry);
            remember();
            continue;
          }
          if (prepare === 0 && submitted && errorCode(error) === BFF_CSRF_INVALID && id) {
            await api.issueCsrf();
            const state = (await api.readTransaction(id)).data;
            if (state.stage === "LOGIN") return (await api.login(username, password, id)).data;
          }
          if (id && isUncertainLogin(error)) {
            const result = await recover(id);
            if (result.stage === "SELECT_TENANT" || result.stage === "COMPLETED") return result;
          }
          throw error;
        }
      }
      throw new Error("无法准备登录，请重试");
    };
    active = attempt().finally(() => {
      active = undefined;
    });
    return active;
  };
  const selectOnce = async (tenantId: string): Promise<LoginResult> => {
    const id = stored();
    if (!id) throw new Error("登录流程已失效，请重新输入账号密码");
    try {
      return (await api.selectTenant(id, tenantId)).data;
    } catch (error) {
      if (errorCode(error) === BFF_CSRF_INVALID) {
        await api.issueCsrf();
        const state = (await api.readTransaction(id)).data;
        if (state.stage === "SELECT_TENANT") return (await api.selectTenant(id, tenantId)).data;
      }
      if (isUncertainLogin(error)) {
        const result = await recover(id);
        if (result.stage === "SELECT_TENANT" || result.stage === "COMPLETED") return result;
      }
      throw error;
    }
  };
  const select = (tenantId: string): Promise<LoginResult> => {
    if (selecting) return selecting;
    selecting = selectOnce(tenantId).finally(() => {
      selecting = undefined;
    });
    return selecting;
  };
  const restoreOnce = async (): Promise<TransactionView | null> => {
    const id = stored();
    if (!id || !/^[A-Za-z0-9_-]{22,128}$/.test(id)) {
      remember();
      return null;
    }
    await api.ensureCsrf();
    const state = await recover(id);
    if (state.stage === "SELECT_TENANT" || state.stage === "COMPLETED") {
      remember(id);
      return state;
    }
    remember();
    return null;
  };
  const restore = (): Promise<TransactionView | null> => {
    if (restoring) return restoring;
    restoring = restoreOnce().finally(() => {
      restoring = undefined;
    });
    return restoring;
  };
  const confirmOnce = async (result: CompletedLoginResult): Promise<SessionMe> => {
    // 仅复用本流刚从服务端读取的同一对象；POST完成响应或外部对象仍须读取校验。
    const observed = completedRead === result ? completedRead : undefined;
    completedRead = undefined;
    let state = observed ?? (await api.readTransaction(result.transactionId)).data;
    if (state.stage !== "COMPLETED") throw new Error("登录结果已变化，请重新认证");
    if (!state.sessionEstablished) {
      await api.resume(result.transactionId);
      state = (await api.readTransaction(result.transactionId)).data;
      if (state.stage !== "COMPLETED" || !state.sessionEstablished)
        throw new Error("浏览器未能保存登录Cookie，请检查设置后重试");
    }
    // me验证权威sid并确认真实Cookie交付；不能仅凭旧me成功跳过上述事务核对。
    return (await api.me()).data;
  };
  const confirm = (result: CompletedLoginResult): Promise<SessionMe> => {
    if (confirming) {
      return confirmingId === result.transactionId
        ? confirming
        : Promise.reject(new Error("正在确认另一登录结果，请稍后重试"));
    }
    confirmingId = result.transactionId;
    confirming = confirmOnce(result).finally(() => {
      confirming = undefined;
      confirmingId = undefined;
    });
    return confirming;
  };
  return {
    submit,
    select,
    restore,
    confirm,
    reset: () => {
      completedRead = undefined;
      remember();
    },
    transaction: stored,
  };
};
