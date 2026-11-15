import type { HttpClient, HttpRequestConfig, R } from "@ingot/http-client";
import { clearCsrfToken, currentCsrfToken, rememberCsrfToken } from "./csrf";
import { BFF_CONTEXT_HEADER, currentSessionContext } from "./context";
import type { OrganizationQuery, OrganizationPage, OrganizationSwitchView } from "./types";
import {
  assertNoPendingLogout,
  authAppId,
  beginPendingLogout,
  confirmPendingLogout,
  readLogoutState,
  LogoutPendingError,
} from "./logoutState";
import {
  CSRF_HEADER,
  type AuthEntry,
  type CompletedLoginResult,
  type CreateTransactionResult,
  type CsrfResult,
  type LoginResult,
  type SessionMe,
  type TransactionView,
} from "./types";

export type AuthTransport = Pick<HttpClient, "post" | "get" | "delete">;
const ROOT = "/api/bff/auth";
export const createAuthApi = (http: AuthTransport, entry: AuthEntry) => {
  const appId = authAppId(entry);
  const path = `${ROOT}/${entry}`;
  const silent = {
    feedback: "silent" as const,
    ...(typeof location === "undefined" ? {} : { baseURL: location.origin }),
  };
  let issuing: Promise<R<CsrfResult>> | undefined;
  const issueCsrf = (signal?: AbortSignal): Promise<R<CsrfResult>> => {
    if (issuing) return issuing;
    issuing = http
      .post<CsrfResult>(`${ROOT}/csrf`, {}, { ...silent, ...(signal ? { signal } : {}) })
      .then((result) => {
        rememberCsrfToken(result.data.csrfToken, entry, result.data.expiresAt);
        return result;
      })
      .finally(() => {
        issuing = undefined;
      });
    return issuing;
  };
  const ensureCsrf = async (signal?: AbortSignal): Promise<void> => {
    if (!currentCsrfToken(entry)) await issueCsrf(signal);
  };
  const writeConfig = (contextVersion = currentSessionContext()): HttpRequestConfig => ({
    ...silent,
    headers: {
      [CSRF_HEADER]: currentCsrfToken(entry) ?? "",
      ...(contextVersion ? { [BFF_CONTEXT_HEADER]: contextVersion } : {}),
    },
  });
  return {
    issueCsrf,
    ensureCsrf,
    createTransaction: async (): Promise<R<CreateTransactionResult>> => {
      assertNoPendingLogout(appId);
      // 每次用户尝试都询问服务端，幂等自举不轮换有效绑定。
      await issueCsrf();
      assertNoPendingLogout(appId);
      return http.post<CreateTransactionResult>(`${path}/transactions`, {}, writeConfig());
    },
    readTransaction: (id: string, timeoutMs?: number): Promise<R<TransactionView>> =>
      http.get<TransactionView>(`${path}/transactions/${encodeURIComponent(id)}`, null, {
        ...silent,
        ...(timeoutMs === undefined ? {} : { timeout: timeoutMs }),
      }),
    login: async (
      username: string,
      password: string,
      transactionId: string,
    ): Promise<R<LoginResult>> => {
      assertNoPendingLogout(appId);
      await ensureCsrf();
      assertNoPendingLogout(appId);
      const config: HttpRequestConfig & { crypto: { request: { mode: "whole" } } } = {
        ...writeConfig(),
        crypto: { request: { mode: "whole" } },
      };
      return http.post<LoginResult>(`${path}/login`, { transactionId, username, password }, config);
    },
    selectTenant: async (transactionId: string, tenantId: string): Promise<R<LoginResult>> => {
      assertNoPendingLogout(appId);
      await ensureCsrf();
      assertNoPendingLogout(appId);
      return http.post<LoginResult>(
        `${ROOT}/tenant/select`,
        { transactionId, tenantId },
        writeConfig(),
      );
    },
    resume: async (id: string): Promise<R<CompletedLoginResult>> => {
      assertNoPendingLogout(appId);
      await ensureCsrf();
      assertNoPendingLogout(appId);
      return http.post<CompletedLoginResult>(
        `${path}/transactions/${encodeURIComponent(id)}/resume`,
        {},
        writeConfig(),
      );
    },
    me: async (signal?: AbortSignal): Promise<R<SessionMe>> => {
      assertNoPendingLogout(appId);
      const admittedLogout = readLogoutState(appId)?.operationId;
      return http
        .get<SessionMe>(`${ROOT}/me`, null, { ...silent, ...(signal ? { signal } : {}) })
        .then((result) => {
          assertNoPendingLogout(appId);
          if (readLogoutState(appId)?.operationId !== admittedLogout)
            throw new LogoutPendingError();
          return result;
        });
    },
    queryOrganizations: async (query: OrganizationQuery): Promise<R<OrganizationPage>> => {
      assertNoPendingLogout(appId);
      const sourceVersion = currentSessionContext() ?? "";
      await ensureCsrf();
      assertNoPendingLogout(appId);
      return http.post<OrganizationPage>(
        `${ROOT}/tenant/organizations/query`,
        query,
        writeConfig(sourceVersion),
      );
    },
    createOrganizationSwitch: async (tenantId: string): Promise<R<OrganizationSwitchView>> => {
      assertNoPendingLogout(appId);
      const sourceVersion = currentSessionContext() ?? "";
      await issueCsrf();
      assertNoPendingLogout(appId);
      return http.post<OrganizationSwitchView>(
        `${ROOT}/tenant/switch-transactions`,
        { tenantId },
        writeConfig(sourceVersion),
      );
    },
    commitOrganizationSwitch: async (
      id: string,
      signal?: AbortSignal,
    ): Promise<R<OrganizationSwitchView>> => {
      assertNoPendingLogout(appId);
      const sourceVersion = currentSessionContext() ?? "";
      await ensureCsrf(signal);
      assertNoPendingLogout(appId);
      return http.post<OrganizationSwitchView>(
        `${ROOT}/tenant/switch-transactions/${encodeURIComponent(id)}/commit`,
        {},
        { ...writeConfig(sourceVersion), ...(signal ? { signal } : {}) },
      );
    },
    readOrganizationSwitch: (
      id: string,
      timeout?: number,
      signal?: AbortSignal,
    ): Promise<R<OrganizationSwitchView>> =>
      http.get<OrganizationSwitchView>(
        `${ROOT}/tenant/switch-transactions/${encodeURIComponent(id)}`,
        null,
        { ...silent, ...(timeout === undefined ? {} : { timeout }), ...(signal ? { signal } : {}) },
      ),
    resumeOrganizationSwitch: async (
      id: string,
      signal?: AbortSignal,
    ): Promise<R<OrganizationSwitchView>> => {
      assertNoPendingLogout(appId);
      await ensureCsrf(signal);
      assertNoPendingLogout(appId);
      return http.post<OrganizationSwitchView>(
        `${ROOT}/tenant/switch-transactions/${encodeURIComponent(id)}/resume`,
        {},
        { ...writeConfig(), ...(signal ? { signal } : {}) },
      );
    },
    logout: async (
      signal?: AbortSignal,
      contextVersion = currentSessionContext(),
    ): Promise<R<void>> => {
      // 必须在CSRF异步准备之前捕获。重试沿用原意图，不从新Cookie重读身份。
      const pending = beginPendingLogout(appId, contextVersion);
      try {
        await issueCsrf(signal);
        const result = await http.delete<void>(`${ROOT}/logout`, null, {
          ...writeConfig(pending.contextVersion),
          ...(signal ? { signal } : {}),
        });
        confirmPendingLogout(appId, pending.operationId);
        return result;
      } finally {
        clearCsrfToken(entry);
      }
    },
  };
};
export type AuthApi = ReturnType<typeof createAuthApi>;
