import { inject, provide, type InjectionKey } from "vue";
import type { LoginResult, TransactionView } from "@ingot/auth-core";

export interface AuthAppearance {
  copyright: string;
  loginBanner: string;
  errorImage: string;
  title: string;
  desc: string;
}

export interface AuthSession {
  includeTenantSelect: boolean;
  appearance: AuthAppearance;
  logoUrl: string;
  startUrl: string;
  restoreTransaction: (tx: string) => Promise<TransactionView>;
  preAuthorize: (input: { username: string; password: string }) => Promise<LoginResult>;
  selectTenant: (tenantId: string) => Promise<LoginResult>;
  followReady: (result: LoginResult) => void;
  restartIfExpired: (error: unknown) => boolean;
  warn: (message: string) => void;
}

export const AUTH_SESSION_KEY: InjectionKey<AuthSession> = Symbol("ingot.auth.session");

export function provideAuthSession(session: AuthSession): void {
  provide(AUTH_SESSION_KEY, session);
}

export function useAuthSession(): AuthSession {
  const session = inject(AUTH_SESSION_KEY);
  if (!session) {
    throw new Error("AuthSession 未提供，登录页必须由宿主 App 注入");
  }
  return session;
}
