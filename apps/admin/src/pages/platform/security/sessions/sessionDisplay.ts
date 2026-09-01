import type { PlatformSessionVO } from "@base/models";

const pad = (value: number): string => String(value).padStart(2, "0");

export function formatSessionTime(value?: string): string {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function displaySessionUser(session: PlatformSessionVO): string {
  return session.nickname || session.username || String(session.userId ?? "-");
}

export function displaySessionTenant(session: PlatformSessionVO): string {
  return session.tenantName || String(session.tenantId ?? "-");
}
