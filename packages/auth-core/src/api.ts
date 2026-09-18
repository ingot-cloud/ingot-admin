import type { HttpClient, HttpRequestConfig, R } from "@ingot/http-client";
import {
  bindCsrfToTransaction,
  clearCsrfToken,
  csrfMatchesTransaction,
  currentCsrfToken,
  rememberCsrfToken,
} from "./csrf";
import type {
  AuthEntry,
  CompleteResult,
  CreateTransactionResult,
  CsrfResult,
  LoginResult,
  SessionMe,
  TransactionView,
} from "./types";

type HybridConfig = HttpRequestConfig & {
  crypto?: { request?: { mode: "whole" } };
};

const entryPath = (entry: AuthEntry): string => `/api/bff/auth/${entry}`;

export const createAuthApi = (http: HttpClient, entry: AuthEntry) => {
  const issueCsrf = async (): Promise<R<CsrfResult>> => {
    const result = await http.post<CsrfResult>("/api/bff/auth/csrf", {});
    rememberCsrfToken(result.data.csrfToken);
    return result;
  };

  const ensureCsrf = async (): Promise<void> => {
    if (!currentCsrfToken()) {
      await issueCsrf();
    }
  };

  const ensureCsrfForTransaction = async (transactionId: string): Promise<void> => {
    if (csrfMatchesTransaction(transactionId)) {
      return;
    }
    await issueCsrf();
    bindCsrfToTransaction(transactionId);
  };

  return {
    issueCsrf,
    ensureCsrf,
    ensureCsrfForTransaction,
    createTransaction: async (): Promise<R<CreateTransactionResult>> => {
      await issueCsrf();
      return http.post<CreateTransactionResult>(`${entryPath(entry)}/transactions`, {});
    },
    readTransaction: (transactionId: string): Promise<R<TransactionView>> =>
      http.get<TransactionView>(`${entryPath(entry)}/transactions/${transactionId}`),
    login: async (username: string, password: string, transactionId: string): Promise<R<LoginResult>> => {
      await ensureCsrfForTransaction(transactionId);
      const config: HybridConfig = {
        crypto: { request: { mode: "whole" } },
      };
      return http.post<LoginResult>(
        `${entryPath(entry)}/login`,
        { transactionId, username, password },
        config,
      );
    },
    selectTenant: async (transactionId: string, tenantId: string): Promise<R<LoginResult>> => {
      await ensureCsrfForTransaction(transactionId);
      return http.post<LoginResult>("/api/bff/auth/tenant/select", { transactionId, tenantId });
    },
    complete: async (ticket: string): Promise<R<CompleteResult>> => {
      await ensureCsrf();
      return http.post<CompleteResult>(`${entryPath(entry)}/complete`, { ticket });
    },
    me: (): Promise<R<SessionMe>> =>
      http.get<SessionMe>("/api/bff/auth/me", null, { feedback: "silent" }),
    logout: async (): Promise<R<void>> => {
      try {
        await issueCsrf();
      } catch {
        // BFF still clears the local session if CSRF later mismatches.
      }
      try {
        return await http.delete<void>("/api/bff/auth/logout");
      } finally {
        clearCsrfToken();
      }
    },
  };
};

export type AuthApi = ReturnType<typeof createAuthApi>;
