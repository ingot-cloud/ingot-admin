import { newEnumExt } from "@ingot/admin-core";

export enum RateLimitDimensionEnum {
  IP = "IP",
  DEVICE = "DV",
  USER = "UI",
  CLIENT = "CL",
}

export const RateLimitDimensionEnumExtArray = [
  newEnumExt(RateLimitDimensionEnum.IP, "IP", "primary"),
  newEnumExt(RateLimitDimensionEnum.DEVICE, "设备", "success"),
  newEnumExt(RateLimitDimensionEnum.USER, "用户", "warning"),
  newEnumExt(RateLimitDimensionEnum.CLIENT, "Client", "info"),
];

export const useRateLimitDimensionEnum = () => useEnum(RateLimitDimensionEnumExtArray);

export enum ControlBehaviorEnum {
  FAST_FAIL = "F",
  QUEUE = "Q",
}

export const ControlBehaviorEnumExtArray = [
  newEnumExt(ControlBehaviorEnum.FAST_FAIL, "快速失败", "danger"),
  newEnumExt(ControlBehaviorEnum.QUEUE, "排队", "warning"),
];

export const useControlBehaviorEnum = () => useEnum(ControlBehaviorEnumExtArray);

export enum IpListTypeEnum {
  BLACK = "B",
  WHITE = "W",
}

export const IpListTypeEnumExtArray = [
  newEnumExt(IpListTypeEnum.BLACK, "黑名单", "danger"),
  newEnumExt(IpListTypeEnum.WHITE, "白名单", "success"),
];

export const useIpListTypeEnum = () => useEnum(IpListTypeEnumExtArray);

export enum IpListKeyTypeEnum {
  IP = "IP",
  DEVICE = "DV",
  USER = "UI",
  CIDR = "CD",
  USER_AGENT = "UA",
  REFERER = "RF",
  CLIENT = "CL",
}

export const IpListKeyTypeEnumExtArray = [
  newEnumExt(IpListKeyTypeEnum.IP, "IP", "primary"),
  newEnumExt(IpListKeyTypeEnum.DEVICE, "设备", "success"),
  newEnumExt(IpListKeyTypeEnum.USER, "用户 ID", "warning"),
  newEnumExt(IpListKeyTypeEnum.CIDR, "CIDR", "info"),
  newEnumExt(IpListKeyTypeEnum.USER_AGENT, "User-Agent", "info"),
  newEnumExt(IpListKeyTypeEnum.REFERER, "Referer", "info"),
  newEnumExt(IpListKeyTypeEnum.CLIENT, "Client", "primary"),
];

export const useIpListKeyTypeEnum = () => useEnum(IpListKeyTypeEnumExtArray);

export enum IpListSourceEnum {
  MANUAL = "M",
  AUTO = "A",
}

export const IpListSourceEnumExtArray = [
  newEnumExt(IpListSourceEnum.MANUAL, "手工", "primary"),
  newEnumExt(IpListSourceEnum.AUTO, "自动", "info"),
];

export const useIpListSourceEnum = () => useEnum(IpListSourceEnumExtArray);

export enum LoginFailureDimensionEnum {
  IP = "IP",
  DEVICE = "DEVICE",
  CLIENT = "CLIENT",
  ACCOUNT_IP = "ACCOUNT_IP",
}

export interface LoginFailureDimensionMeta {
  value: LoginFailureDimensionEnum;
  label: string;
  hint: string;
  tag: "primary" | "success" | "warning" | "info" | "danger";
}

export const LoginFailureDimensionMetaList: Array<LoginFailureDimensionMeta> = [
  {
    value: LoginFailureDimensionEnum.IP,
    label: "IP",
    hint: "不影响账号锁定，仅封 IP",
    tag: "primary",
  },
  {
    value: LoginFailureDimensionEnum.DEVICE,
    label: "设备",
    hint: "需 BFF 传递 In-Ca-Sig",
    tag: "success",
  },
  {
    value: LoginFailureDimensionEnum.CLIENT,
    label: "Client",
    hint: "仅统计带用户名的密码错误",
    tag: "warning",
  },
  {
    value: LoginFailureDimensionEnum.ACCOUNT_IP,
    label: "账号+IP",
    hint: "定向撞库防护，达阈值封 IP",
    tag: "danger",
  },
];

export const LoginFailureDimensionEnumExtArray = LoginFailureDimensionMetaList.map((item) =>
  newEnumExt(item.value, item.label, item.tag),
);

export const useLoginFailureDimensionEnum = () => useEnum(LoginFailureDimensionEnumExtArray);

export const getLoginFailureDimensionHint = (dimension: string): string => {
  return LoginFailureDimensionMetaList.find((item) => item.value === dimension)?.hint ?? "";
};

export enum HttpMethodEnum {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
  PATCH = "PATCH",
  ALL = "ANY",
}

export const HttpMethodEnumExtArray = [
  newEnumExt(HttpMethodEnum.GET, "GET", "primary"),
  newEnumExt(HttpMethodEnum.POST, "POST", "success"),
  newEnumExt(HttpMethodEnum.PUT, "PUT", "warning"),
  newEnumExt(HttpMethodEnum.DELETE, "DELETE", "danger"),
  newEnumExt(HttpMethodEnum.PATCH, "PATCH", "info"),
  newEnumExt(HttpMethodEnum.ALL, "ANY", "info"),
];

export const useHttpMethodEnum = () => useEnum(HttpMethodEnumExtArray);

export enum ChallengeTriggerEnum {
  ALWAYS = "always",
  ON_RATE_LIMIT = "on_rate_limit",
}

export const ChallengeTriggerEnumExtArray = [
  newEnumExt(ChallengeTriggerEnum.ALWAYS, "始终挑战", "warning"),
  newEnumExt(ChallengeTriggerEnum.ON_RATE_LIMIT, "限流后挑战", "danger"),
];

export const useChallengeTriggerEnum = () => useEnum(ChallengeTriggerEnumExtArray);

export enum ChallengeTypeEnum {
  SLIDER = "SLIDER",
  IMAGE = "IMAGE",
}

export const ChallengeTypeEnumExtArray = [
  newEnumExt(ChallengeTypeEnum.SLIDER, "滑块", "primary"),
  newEnumExt(ChallengeTypeEnum.IMAGE, "图形", "success"),
];

export const useChallengeTypeEnum = () => useEnum(ChallengeTypeEnumExtArray);

export enum AccessProtectionTabEnum {
  ENDPOINT_GROUP = "endpoint-group",
  RATE_LIMIT = "rate-limit",
  IP_LIST = "ip-list",
  VIOLATION_ESCALATION = "violation-escalation",
  LOGIN_FAILURE = "login-failure",
  CHALLENGE = "challenge",
  BLOCK_EVENT = "block-event",
}

export const AccessProtectionTabEnumExtArray = [
  newEnumExt(AccessProtectionTabEnum.ENDPOINT_GROUP, "API 路径分组", "primary"),
  newEnumExt(AccessProtectionTabEnum.RATE_LIMIT, "限流规则", "success"),
  newEnumExt(AccessProtectionTabEnum.IP_LIST, "黑白名单", "warning"),
  newEnumExt(AccessProtectionTabEnum.VIOLATION_ESCALATION, "违规升级", "danger"),
  newEnumExt(AccessProtectionTabEnum.LOGIN_FAILURE, "登录失败保护", "info"),
  newEnumExt(AccessProtectionTabEnum.CHALLENGE, "挑战策略", "warning"),
  newEnumExt(AccessProtectionTabEnum.BLOCK_EVENT, "封禁审计", "info"),
];

export const useAccessProtectionTabEnum = () => useEnum(AccessProtectionTabEnumExtArray);
