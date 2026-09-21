export const OBJECT_ACTION_DENIED_MESSAGE = "当前对象不允许该操作";

export const ACTION_UNAVAILABLE_MESSAGE = "当前不可操作";

export interface ObjectActionCapability {
  allowed?: boolean;
  message?: string;
}

export type ObjectActionCapabilities = Record<string, ObjectActionCapability>;

export interface ObjectActionDecision {
  allowed: boolean;
  message?: string;
}

export interface ActionAccess {
  visible: boolean;
  allowed: boolean;
  message?: string;
}

/**
 * 对象级能力只解释「这一条」能不能做。
 * 列表未返回该操作码时不视为越界，是否展示由会话 actionCodes 决定。
 * 与 `@ingot/admin-common` 的 `objectActionAllowed` 保持同一语义。
 */
export function objectActionAllowed(
  capabilities: ObjectActionCapabilities | undefined,
  actionCode: string,
): ObjectActionDecision {
  const item = capabilities?.[actionCode];
  if (!item) {
    return { allowed: true };
  }
  if (item.allowed === true) {
    return { allowed: true, message: item.message };
  }
  const message = item.message?.trim();
  return {
    allowed: false,
    message: message || OBJECT_ACTION_DENIED_MESSAGE,
  };
}

export function resolveActionAccess(
  actionCode: string,
  options: {
    hasAction: boolean;
    capabilities?: ObjectActionCapabilities;
  },
): ActionAccess {
  if (!options.hasAction) {
    return { visible: false, allowed: false };
  }
  const object = objectActionAllowed(options.capabilities, actionCode);
  return {
    visible: true,
    allowed: object.allowed,
    message: object.message,
  };
}

export function disabledActionHint(disabled: boolean | undefined, reason?: string): string | undefined {
  if (!disabled) {
    return undefined;
  }
  const trimmed = reason?.trim();
  return trimmed || ACTION_UNAVAILABLE_MESSAGE;
}
