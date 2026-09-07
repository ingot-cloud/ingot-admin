import type { InTableAction, TableHeaderRecord } from "@ingot/admin-core";
import type { PlatformSessionVO } from "@/models";
import { SESSION_REVOKE_PERMISSION } from "./constants";
import { formatSessionTime } from "./sessionDisplay";

export const SESSIONS_TABLE_ID = "security-sessions";

export const tableHeaders: Array<TableHeaderRecord> = [
  {
    label: "用户",
    prop: "user",
    minWidth: "160",
  },
  {
    label: "组织",
    prop: "tenantName",
    minWidth: "140",
  },
  {
    label: "客户端",
    prop: "clientId",
    minWidth: "120",
  },
  {
    label: "客户端缺省",
    prop: "authType",
    width: "120",
  },
  {
    label: "用户类型",
    prop: "userType",
    width: "110",
  },
  {
    label: "登录 IP",
    prop: "ipAddress",
    minWidth: "130",
  },
  {
    label: "位置",
    prop: "location",
    minWidth: "120",
  },
  {
    label: "设备",
    prop: "deviceType",
    width: "90",
  },
  {
    label: "颁发时间",
    prop: "issuedAt",
    minWidth: "170",
    hide: true,
    transform: formatSessionTime,
  },
  {
    label: "过期时间",
    prop: "expiresAt",
    minWidth: "170",
    transform: formatSessionTime,
  },
  {
    label: "最近凭据活动",
    prop: "lastAccessAt",
    minWidth: "170",
    transform: formatSessionTime,
  },
  {
    label: "会话 ID",
    prop: "sid",
    minWidth: "220",
    hide: true,
  },
  {
    label: "Token ID",
    prop: "jti",
    minWidth: "220",
    hide: true,
  },
  {
    label: "操作系统",
    prop: "os",
    minWidth: "120",
    hide: true,
  },
  {
    label: "浏览器",
    prop: "browser",
    minWidth: "120",
    hide: true,
  },
  {
    label: "操作",
    prop: "actions",
    width: "260",
    fixed: "right",
  },
];

export function createSessionRowActions(
  _row: PlatformSessionVO,
  handlers: {
    onDetail: (row: PlatformSessionVO) => void;
    onRevokeSid: (row: PlatformSessionVO) => void;
    onRevokeUser: (row: PlatformSessionVO) => void;
  },
): Array<InTableAction<PlatformSessionVO>> {
  return [
    {
      key: "detail",
      label: "详情",
      kind: "detail",
      onSelect: handlers.onDetail,
    },
    {
      key: "revoke-sid",
      label: "强制下线",
      kind: "danger",
      permission: SESSION_REVOKE_PERMISSION,
      onSelect: handlers.onRevokeSid,
    },
    {
      key: "revoke-user",
      label: "下线该用户",
      kind: "danger",
      permission: SESSION_REVOKE_PERMISSION,
      onSelect: handlers.onRevokeUser,
    },
  ];
}
