import type { TableHeaderRecord } from "@ingot/admin-core";
import { formatSessionTime } from "./sessionDisplay";

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
    align: "center",
  },
  {
    label: "用户类型",
    prop: "userType",
    width: "110",
    align: "center",
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
    align: "center",
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
    align: "center",
  },
];
