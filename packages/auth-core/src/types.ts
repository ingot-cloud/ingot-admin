export const CSRF_HEADER = "X-CSRF-Token";

export const RETURN_TO_STORAGE_KEY = "ingot.auth.returnTo";

export const EXPLICIT_LOGOUT_STORAGE_KEY = "ingot.auth.explicitLogout";

export type AuthEntry = "platform" | "tenant";

export type AuthorizationDomain = "PLATFORM" | "TENANT";

export type LoginStage = "LOGIN" | "SELECT_TENANT" | "READY";

export interface TenantCandidate {
  id: string;
  name: string;
}

export interface CsrfResult {
  csrfToken: string;
}

export interface CreateTransactionResult {
  transactionId: string;
  loginUrl: string;
}

export interface TransactionView {
  transactionId: string;
  stage: LoginStage;
  expiresAt: number;
  allows?: TenantCandidate[];
  completionUrl?: string;
}

export interface LoginResult {
  stage: "SELECT_TENANT" | "READY";
  transactionId: string;
  allows?: TenantCandidate[];
  completionUrl?: string;
}

export interface CompleteResult {
  returnTo: string;
}

export interface SessionMe {
  appId: string;
  domain: AuthorizationDomain;
  tenantId: string | null;
  userId: number;
  clientId: string;
}
