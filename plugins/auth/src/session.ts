import { inject, provide, type InjectionKey } from "vue";
import type { AuthSession } from "@ingot/auth-core";
export type { AuthAppearance, AuthSession } from "@ingot/auth-core";
export const AUTH_SESSION_KEY: InjectionKey<AuthSession> = Symbol("ingot.auth.session");
export function provideAuthSession(session: AuthSession): void {
  provide(AUTH_SESSION_KEY, session);
}
export function useAuthSession(): AuthSession {
  const session = inject(AUTH_SESSION_KEY);
  if (!session) throw new Error("同源登录能力未由管理宿主注入");
  return session;
}
