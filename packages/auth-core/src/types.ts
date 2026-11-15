export const CSRF_HEADER = "X-CSRF-Token";
export const LOGIN_PATH = "/login/";
export const RETURN_TO_STORAGE_KEY = "ingot.auth.returnTo";
export const EXPLICIT_LOGOUT_QUERY_KEY = "loggedOut";
export const EXPLICIT_LOGOUT_STORAGE_KEY = "ingot.auth.explicitLogout";
export type AuthEntry = "platform" | "tenant";
export type AuthorizationDomain = "PLATFORM" | "TENANT";
export type LoginStage =
  | "LOGIN"
  | "AUTHENTICATING"
  | "SELECT_TENANT"
  | "COMMITTING"
  | "COMPLETED"
  | "FAILED"
  | "EXPIRED"
  | "UNKNOWN";
export interface TenantCandidate {
  id: string;
  name: string;
}
export interface CsrfResult {
  csrfToken: string;
  expiresAt: string;
}
export interface CreateTransactionResult {
  transactionId: string;
  stage: "LOGIN";
  expiresAt: string;
}
export interface TenantSelection {
  transactionId: string;
  stage: "SELECT_TENANT";
  expiresAt: string;
  allows: TenantCandidate[];
}
export interface CompletedLoginResult {
  transactionId: string;
  stage: "COMPLETED";
  returnTo: string;
  recoveryExpiresAt: string;
  /** 只有读取事务时返回；已有其他账号会话不表示本事务完成。 */
  sessionEstablished?: boolean;
}
export type LoginResult = TenantSelection | CompletedLoginResult;
export type TransactionView =
  | LoginResult
  | CreateTransactionResult
  | {
      transactionId: string;
      stage: "AUTHENTICATING" | "COMMITTING" | "FAILED" | "EXPIRED" | "UNKNOWN";
      expiresAt: string;
      retryAfterMs?: number;
    };
export interface SessionMe {
  appId: string;
  domain: AuthorizationDomain;
  tenantId: string | null;
  userId: number;
  clientId: string;
  /** 公开上下文版本，不是 sessionId 或 token。 */
  contextVersion?: string;
  expiresAt?: string;
}

export interface OrganizationSummary {
  id: string;
  name: string | null;
}
export interface OrganizationQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
}
export interface OrganizationPage {
  currentTenant: OrganizationSummary;
  currentTenantAccessible: boolean;
  records: OrganizationSummary[];
  total: number;
  switchableTotal: number;
  page: number;
  pageSize: number;
}
export type OrganizationSwitchStage =
  "PREPARED" | "ISSUING" | "COMMITTING" | "COMPLETED" | "FAILED" | "EXPIRED" | "UNKNOWN";
export interface OrganizationSwitchView {
  transactionId: string;
  tenantId: string;
  stage: OrganizationSwitchStage;
  expiresAt: string;
  recoveryExpiresAt?: string | null;
  sessionEstablished?: boolean | null;
}
