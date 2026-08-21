import { newEnumExt } from "../common";

export enum OnlineTokenTabEnum {
  SESSION = "session",
  POLICY = "policy",
}

export const OnlineTokenTabEnumExtArray = [
  newEnumExt(OnlineTokenTabEnum.SESSION, "在线会话", "primary"),
  newEnumExt(OnlineTokenTabEnum.POLICY, "并发策略", "warning"),
];

export const useOnlineTokenTabEnum = () => useEnum(OnlineTokenTabEnumExtArray);

export enum SessionUserTypeEnum {
  ADMIN = "0",
  APP = "1",
}

export const SessionUserTypeEnumExtArray = [
  newEnumExt(SessionUserTypeEnum.ADMIN, "管理用户", "primary"),
  newEnumExt(SessionUserTypeEnum.APP, "C 端用户", "info"),
];

export const useSessionUserTypeEnum = () => useEnum(SessionUserTypeEnumExtArray);

export enum SessionConcurrencyScopeEnum {
  GLOBAL = "GLOBAL",
  CLIENT = "CLIENT",
  USER_TYPE = "USER_TYPE",
}

export const SessionConcurrencyScopeEnumExtArray = [
  newEnumExt(SessionConcurrencyScopeEnum.GLOBAL, "全局兜底", "info"),
  newEnumExt(SessionConcurrencyScopeEnum.CLIENT, "按客户端", "primary"),
  newEnumExt(SessionConcurrencyScopeEnum.USER_TYPE, "按用户类型", "warning"),
];

export const useSessionConcurrencyScopeEnum = () => useEnum(SessionConcurrencyScopeEnumExtArray);

export enum SessionConcurrencyOverflowEnum {
  REJECT = "REJECT",
  KICK_OLDEST = "KICK_OLDEST",
  KICK_ALL = "KICK_ALL",
}

export const SessionConcurrencyOverflowEnumExtArray = [
  newEnumExt(SessionConcurrencyOverflowEnum.REJECT, "拒绝新登录", "danger"),
  newEnumExt(SessionConcurrencyOverflowEnum.KICK_OLDEST, "踢最旧会话", "warning"),
  newEnumExt(SessionConcurrencyOverflowEnum.KICK_ALL, "踢全部旧会话", "danger"),
];

export const useSessionConcurrencyOverflowEnum = () =>
  useEnum(SessionConcurrencyOverflowEnumExtArray);

export enum SessionConcurrencyDimensionEnum {
  USER_CLIENT = "USER_CLIENT",
}

export const SessionConcurrencyDimensionEnumExtArray = [
  newEnumExt(SessionConcurrencyDimensionEnum.USER_CLIENT, "同一用户 + 同一 Client", "primary"),
];

export const useSessionConcurrencyDimensionEnum = () =>
  useEnum(SessionConcurrencyDimensionEnumExtArray);
