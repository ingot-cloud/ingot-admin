import type { HttpClient, HttpRequestConfig, R } from "@ingot/http-client";
import { clearCsrfToken, currentCsrfToken, rememberCsrfToken } from "./csrf";
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
  const ensureCsrf = async (): Promise<void> => {
    if (!currentCsrfToken(entry)) await issueCsrf();
  };
  const writeConfig = (): HttpRequestConfig => ({
    ...silent,
    headers: { [CSRF_HEADER]: currentCsrfToken(entry) ?? "" },
  });
  return {
    issueCsrf,
    ensureCsrf,
    createTransaction: async (): Promise<R<CreateTransactionResult>> => {
      // 每次用户尝试都询问服务端，幂等自举不轮换有效绑定。
      await issueCsrf();
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
      await ensureCsrf();
      const config: HttpRequestConfig & { crypto: { request: { mode: "whole" } } } = {
        ...writeConfig(),
        crypto: { request: { mode: "whole" } },
      };
      return http.post<LoginResult>(`${path}/login`, { transactionId, username, password }, config);
    },
    selectTenant: async (transactionId: string, tenantId: string): Promise<R<LoginResult>> => {
      await ensureCsrf();
      return http.post<LoginResult>(
        `${ROOT}/tenant/select`,
        { transactionId, tenantId },
        writeConfig(),
      );
    },
    resume: async (id: string): Promise<R<CompletedLoginResult>> => {
      await ensureCsrf();
      return http.post<CompletedLoginResult>(
        `${path}/transactions/${encodeURIComponent(id)}/resume`,
        {},
        writeConfig(),
      );
    },
    me: (): Promise<R<SessionMe>> => http.get<SessionMe>(`${ROOT}/me`, null, silent),
    logout: async (signal?: AbortSignal): Promise<R<void>> => {
      try {
        try {
          await issueCsrf(signal);
        } catch (error) {
          if (signal?.aborted) throw error;
          /* 服务端同源退出仍尽力清Cookie。 */
        }
        return await http.delete<void>(`${ROOT}/logout`, null, {
          ...writeConfig(),
          ...(signal ? { signal } : {}),
        });
      } finally {
        clearCsrfToken(entry);
      }
    },
  };
};
export type AuthApi = ReturnType<typeof createAuthApi>;
