import type { SessionMe } from "./types";

export const BFF_CONTEXT_HEADER = "In-Bff-Context-Version";
export const ORGANIZATION_SWITCH_PATH = "/auth/organizations";
export const ORGANIZATION_SYNC_KEY = "ingot.auth.tenant-admin.organization-switch";
export const ORGANIZATION_CHANNEL = "ingot:organization-switch";
let contextVersion: string | undefined;
let verifiedAt = 0;
/** 仅用于忽略发生在新身份确认之前的迟到UI通知，不作为身份认证。 */
export const sessionContextVerifiedAt = (): number => verifiedAt;

/** 版本不是凭据，只能在实际 me 验证成功后接纳，不能从广播建立身份。 */
export const rememberSessionContext = (me: SessionMe): void => {
  contextVersion = me.contextVersion;
  verifiedAt = Date.now();
};
export const currentSessionContext = (): string | undefined => contextVersion;
export const clearSessionContext = (): void => {
  contextVersion = undefined;
  verifiedAt = 0;
};

export interface OrganizationSyncEvent {
  phase: "pending" | "completed" | "cancelled";
  transactionId: string;
  sourceVersion: string;
  expiresAt: string;
  source: string;
}
let localEvent: OrganizationSyncEvent | undefined;
const source = typeof crypto === "undefined" ? "" : crypto.randomUUID();

export const readOrganizationSync = (): OrganizationSyncEvent | undefined => {
  try {
    const raw = localStorage.getItem(ORGANIZATION_SYNC_KEY);
    if (!raw) return localEvent;
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return undefined;
    const event = value as Partial<OrganizationSyncEvent>;
    if (
      !["pending", "completed", "cancelled"].includes(event.phase ?? "") ||
      typeof event.transactionId !== "string" ||
      typeof event.sourceVersion !== "string" ||
      typeof event.expiresAt !== "string" ||
      typeof event.source !== "string"
    )
      return undefined;
    return event as OrganizationSyncEvent;
  } catch {
    return localEvent;
  }
};

/** 仅供暂停与恢复线索；最终会话及事务仍需服务端核对。 */
export const publishOrganizationSync = (event: Omit<OrganizationSyncEvent, "source">): void => {
  localEvent = { ...event, source };
  try {
    localStorage.setItem(ORGANIZATION_SYNC_KEY, JSON.stringify(localEvent));
  } catch {
    /* 本页仍可完成。 */
  }
  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel(ORGANIZATION_CHANNEL);
    channel.postMessage(localEvent);
    channel.close();
  }
};
export const isOwnOrganizationEvent = (event: OrganizationSyncEvent): boolean =>
  event.source === source;
/** localStorage 不可用时，仍保留其他标签页广播的恢复线索。 */
export const rememberOrganizationSync = (event: OrganizationSyncEvent): void => {
  localEvent = event;
};
export const hasPendingOrganizationSwitch = (): boolean => {
  const event = readOrganizationSync();
  return (
    event?.phase === "pending" &&
    Date.parse(event.expiresAt) > Date.now() &&
    (!contextVersion || event.sourceVersion === contextVersion)
  );
};
