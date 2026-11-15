import type { AuthApi } from "./api";
import type { OrganizationSwitchView, SessionMe } from "./types";
import { currentSessionContext } from "./context";

const MAX_RECOVERY_MILLIS = 15_000;
const MAX_POLLS = 15;
const WAIT_MILLIS = 1000;
export class OrganizationSwitchPendingError extends Error {}
const pendingResult = (): OrganizationSwitchPendingError =>
  new OrganizationSwitchPendingError("组织切换结果暂未确认，请重试确认；系统不会重复签发会话");
const unavailable = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  (("status" in error && typeof error.status === "number" && error.status >= 500) ||
    ("kind" in error && (error.kind === "network" || error.kind === "timeout")));
export interface OrganizationFlowOptions {
  storage?: Pick<Storage, "getItem" | "setItem" | "removeItem">;
  wait?: (millis: number) => Promise<void>;
  now?: () => number;
  onPending: (view: OrganizationSwitchView, sourceVersion: string) => void;
}

/** 本标签页合并操作；不透明事务线索可恢复，但任何身份结论都来自实际 Cookie 与 me。 */
export const createOrganizationSwitchFlow = (api: AuthApi, options: OrganizationFlowOptions) => {
  const storageKey = "ingot.auth.tenant-admin.organization-transaction";
  let active: Promise<{ view: OrganizationSwitchView; identity: SessionMe }> | undefined;
  let remembered: string | undefined;
  const wait =
    options.wait ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  const now = options.now ?? (() => performance.now());
  const remember = (id?: string): void => {
    remembered = id;
    try {
      if (id) options.storage?.setItem(storageKey, id);
      else options.storage?.removeItem(storageKey);
    } catch {
      /* 本页内仍可恢复。 */
    }
  };
  const stored = (): string | undefined => {
    try {
      return remembered ?? options.storage?.getItem(storageKey) ?? undefined;
    } catch {
      return remembered;
    }
  };
  const confirm = async (
    view: OrganizationSwitchView,
    signal: AbortSignal,
  ): Promise<{ view: OrganizationSwitchView; identity: SessionMe }> => {
    let state = view;
    if (!state.sessionEstablished) {
      await api.resumeOrganizationSwitch(state.transactionId, signal);
      state = (await api.readOrganizationSwitch(state.transactionId, undefined, signal)).data;
    }
    if (state.stage !== "COMPLETED" || !state.sessionEstablished)
      throw new Error("浏览器未能保存组织会话，请重试确认");
    const identity = (await api.me(signal)).data;
    if (
      identity.appId !== "tenant-admin" ||
      identity.domain !== "TENANT" ||
      identity.tenantId !== state.tenantId ||
      identity.contextVersion !== state.transactionId
    )
      throw new Error("组织会话已变化，请重新确认");
    remember();
    return { view: state, identity };
  };
  const recoverLoop = async (
    id: string,
    signal: AbortSignal,
    commitError?: unknown,
  ): Promise<{ view: OrganizationSwitchView; identity: SessionMe }> => {
    const deadline = now() + MAX_RECOVERY_MILLIS;
    for (let poll = 0; poll < MAX_POLLS && now() < deadline; poll += 1) {
      const state = (
        await api.readOrganizationSwitch(id, Math.max(1, Math.floor(deadline - now())), signal)
      ).data;
      if (state.stage === "COMPLETED") return confirm(state, signal);
      if (state.stage === "FAILED" || state.stage === "EXPIRED") {
        remember();
        if (commitError) throw commitError;
        throw new Error("本次组织切换未完成，请重新选择");
      }
      if (["UNKNOWN", "ISSUING", "COMMITTING"].includes(state.stage)) {
        // BFF 对已提交事务只查询原 Auth 结果，不重复签发。
        try {
          const result = (await api.commitOrganizationSwitch(id, signal)).data;
          if (result.stage === "COMPLETED") continue;
        } catch (error) {
          const code =
            typeof error === "object" && error !== null && "code" in error ? error.code : undefined;
          if (code !== "BFF_TRANSACTION_BUSY" && code !== "BFF_AUTH_UNAVAILABLE") throw error;
        }
      }
      if (state.stage === "PREPARED") {
        remember();
        if (commitError) throw commitError;
        throw new Error("组织切换尚未提交，请重新选择");
      }
      await wait(Math.max(0, Math.min(WAIT_MILLIS, deadline - now())));
    }
    throw pendingResult();
  };
  const recover = async (
    id: string,
    commitError?: unknown,
  ): Promise<{ view: OrganizationSwitchView; identity: SessionMe }> => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const budget = new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => {
        controller.abort();
        reject(pendingResult());
      }, MAX_RECOVERY_MILLIS);
    });
    try {
      return await Promise.race([recoverLoop(id, controller.signal, commitError), budget]);
    } catch (error) {
      if (controller.signal.aborted || unavailable(error)) throw pendingResult();
      throw error;
    } finally {
      clearTimeout(timer);
    }
  };
  const start = (
    tenantId: string,
  ): Promise<{ view: OrganizationSwitchView; identity: SessionMe }> => {
    if (active) return active;
    active = (async () => {
      const sourceVersion = currentSessionContext();
      if (!sourceVersion) throw new Error("请先确认当前登录状态");
      const created = (await api.createOrganizationSwitch(tenantId)).data;
      remember(created.transactionId);
      options.onPending(created, sourceVersion);
      let commitError: unknown;
      try {
        await api.commitOrganizationSwitch(created.transactionId);
      } catch (error) {
        commitError = error;
      }
      return recover(created.transactionId, commitError);
    })().finally(() => {
      active = undefined;
    });
    return active;
  };
  const restore = (
    id = stored(),
  ): Promise<{ view: OrganizationSwitchView; identity: SessionMe } | null> => {
    if (!id || !/^[A-Za-z0-9_-]{22,128}$/.test(id)) return Promise.resolve(null);
    if (active) return active;
    active = recover(id).finally(() => {
      active = undefined;
    });
    return active;
  };
  return { start, restore, hasPending: () => Boolean(stored()), forget: () => remember() };
};
