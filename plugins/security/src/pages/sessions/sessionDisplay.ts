import { formatDateTime } from "@ingot/shared";
import type { PlatformSessionVO } from "@/models";

export function formatSessionTime(value?: string): string {
  return formatDateTime(value);
}

export function displaySessionUser(session: PlatformSessionVO): string {
  return session.nickname || session.username || String(session.userId ?? "-");
}

export function displaySessionTenant(session: PlatformSessionVO): string {
  return session.tenantName || String(session.tenantId ?? "-");
}
