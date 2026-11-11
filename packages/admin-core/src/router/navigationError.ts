import { sanitizeReturnTo } from "@ingot/auth-core";

export const NAVIGATION_ERROR_PATH = "/auth/navigation-error";

/** 仅包含当前身份已返回的菜单冲突，不携带权限或登录凭证。 */
export class MenuConfigurationError extends Error {
  constructor(
    public readonly kind: "path" | "routeName",
    public readonly value: string,
    message: string,
  ) {
    super(message);
    this.name = "MenuConfigurationError";
  }
}

/** 沿用同源返回地址校验，同时避免恢复页重试自身。 */
export const navigationRecoveryPath = (value: unknown): string => {
  const safe = sanitizeReturnTo(typeof value === "string" ? value : undefined);
  if (!safe) return "/";
  let path = new URL(safe, "https://same-origin.invalid").pathname;
  for (let index = 0; index < 3; index++) path = decodeURIComponent(path);
  return path.replace(/\/$/, "") === NAVIGATION_ERROR_PATH ? "/" : safe;
};

export const navigationErrorLocation = (returnTo: string) => ({
  path: NAVIGATION_ERROR_PATH,
  replace: true,
  query: { returnTo: navigationRecoveryPath(returnTo) },
});
