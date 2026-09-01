import Http from "@/net";
import type { R } from "@/models";


/**
 * 撤销Token
 */
export function LogoutAPI(): Promise<R> {
  return Http.delete<void>("/api/bff/auth/logout", null, {
    manualProcessingFailure: true,
  });
}
