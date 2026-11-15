import type { AuthApi } from "./api";
import type { AuthEntry, CompletedLoginResult, SessionMe, OrganizationSwitchView } from "./types";
export type AuthColorScheme = "auto" | "light" | "dark";
export interface AuthAppearance {
  copyright: string;
  loginBanner: string;
  errorImage: string;
  title: string;
  desc: string;
}
/** 宿主提供能力，登录插件不反向导入管理框架或其他插件。 */
export interface AuthSession {
  appId: string;
  entry: AuthEntry;
  includeTenantSelect: boolean;
  appearance: AuthAppearance;
  logoUrl: string;
  logoDarkUrl?: string;
  colorScheme: AuthColorScheme;
  api: AuthApi;
  onAuthenticated: (result: CompletedLoginResult, identity: SessionMe) => Promise<void>;
  onExistingSession: () => Promise<boolean>;
  warn: (message: string) => void;
  error: (message: string) => void;
  /** 仅租户宿主提供；插件不直接操作管理框架状态。 */
  organizationSwitch?: {
    pending: (view: OrganizationSwitchView, sourceVersion: string) => void;
    completed: (view: OrganizationSwitchView, identity: SessionMe) => Promise<void>;
    failed: () => Promise<void>;
    returnToCurrent: (accessible: boolean) => Promise<void>;
    requireLogin: () => Promise<void>;
    logout: () => Promise<void>;
  };
}
