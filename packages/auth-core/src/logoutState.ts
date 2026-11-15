const PREFIX = "ingot.auth.logout.";
const CHANNEL = "ingot:logout";
const records = new Map<string, LogoutState>();
const source = typeof crypto === "undefined" ? "local" : crypto.randomUUID();

/** 非凭据的注销意图；不保存Cookie、token、账号或正式sessionId。 */
export interface LogoutState {
  appId: string;
  operationId: string;
  contextVersion: string;
  phase: "pending" | "confirmed";
  createdAt: number;
  confirmedAt?: number;
  source: string;
}

export class LogoutPendingError extends Error {
  readonly name = "LogoutPendingError";
  constructor() {
    super("注销结果尚未确认，请重试确认退出");
  }
}

export const authAppId = (entry: "platform" | "tenant"): string => `${entry}-admin`;

const valid = (value: unknown): value is LogoutState => {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<LogoutState>;
  return (
    typeof state.appId === "string" &&
    typeof state.operationId === "string" &&
    typeof state.contextVersion === "string" &&
    typeof state.source === "string" &&
    typeof state.createdAt === "number" &&
    (state.phase === "pending" ||
      (state.phase === "confirmed" && typeof state.confirmedAt === "number"))
  );
};

export const readLogoutState = (appId: string): LogoutState | undefined => {
  try {
    const raw = localStorage.getItem(PREFIX + appId);
    if (raw) {
      const value: unknown = JSON.parse(raw);
      if (valid(value) && value.appId === appId) return value;
    }
  } catch {
    /* 存储受限时保留本页和广播取得的意图。 */
  }
  return records.get(appId);
};

export const hasPendingLogout = (appId: string): boolean =>
  readLogoutState(appId)?.phase === "pending";

export const assertNoPendingLogout = (appId: string): void => {
  if (hasPendingLogout(appId)) throw new LogoutPendingError();
};

const publish = (state: LogoutState): void => {
  state = { ...state, source };
  records.set(state.appId, state);
  try {
    localStorage.setItem(PREFIX + state.appId, JSON.stringify(state));
  } catch {
    /* 广播和本页状态仍生效。 */
  }
  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel(CHANNEL);
    channel.postMessage(state);
    channel.close();
  }
};

/** 重试沿用捕获的原上下文，超时不能更换成新Cookie身份。 */
export const beginPendingLogout = (appId: string, contextVersion = ""): LogoutState => {
  const current = readLogoutState(appId);
  if (current?.phase === "pending") return current;
  const state: LogoutState = {
    appId,
    operationId: crypto.randomUUID(),
    contextVersion,
    phase: "pending",
    createdAt: Date.now(),
    source,
  };
  publish(state);
  return state;
};

/** 只能由相同意图的服务端成功响应确认，失败或本地计时器不能调用。 */
export const confirmPendingLogout = (appId: string, operationId: string): void => {
  const current = readLogoutState(appId);
  if (current?.operationId !== operationId || current.phase !== "pending") return;
  publish({ ...current, phase: "confirmed", confirmedAt: Date.now() });
};

/** 其他标签页仅据此暂停/导航，不能从广播建立身份。 */
export const subscribeLogoutState = (
  appId: string,
  listener: (state: LogoutState) => void,
): (() => void) => {
  const receive = (value: unknown): void => {
    if (!valid(value) || value.appId !== appId) return;
    if (value.source === source) return;
    const current = readLogoutState(appId);
    if (current && current.operationId !== value.operationId && current.createdAt >= value.createdAt)
      return;
    if (current?.operationId === value.operationId && current.phase === "confirmed") {
      listener(current);
      return;
    }
    records.set(appId, value);
    listener(value);
  };
  const storage = (event: StorageEvent): void => {
    if (event.key === PREFIX + appId) receive(readLogoutState(appId));
  };
  if (typeof window !== "undefined") window.addEventListener("storage", storage);
  const channel = typeof BroadcastChannel === "undefined" ? undefined : new BroadcastChannel(CHANNEL);
  channel?.addEventListener("message", (event: MessageEvent<unknown>) => receive(event.data));
  return () => {
    if (typeof window !== "undefined") window.removeEventListener("storage", storage);
    channel?.close();
  };
};
