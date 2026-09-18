import request from "@/net";
import { createAuthApi, type AuthEntry, type LoginResult } from "@ingot/auth-core";

const entry = (import.meta.env.VITE_AUTH_ENTRY as AuthEntry | undefined) ?? "tenant";

export const authApi = createAuthApi(request, entry);
export const authEntry = entry;

export async function LoginAPI({
  username,
  password,
  transactionId,
}: {
  username: string;
  password: string;
  transactionId: string;
}): Promise<LoginResult> {
  const response = await authApi.login(username, password, transactionId);
  return response.data;
}

export async function SelectTenantAPI(transactionId: string, tenantId: string): Promise<LoginResult> {
  const response = await authApi.selectTenant(transactionId, tenantId);
  return response.data;
}
