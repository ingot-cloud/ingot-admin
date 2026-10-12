import { CredentialPolicyTypeEnum } from "@/models/enums/credentialEnums";

const NUMERIC_FIELDS: Readonly<Record<CredentialPolicyTypeEnum, readonly string[]>> = {
  [CredentialPolicyTypeEnum.STRENGTH]: ["minLength", "maxLength"],
  [CredentialPolicyTypeEnum.HISTORY]: ["checkCount"],
  [CredentialPolicyTypeEnum.EXPIRATION]: ["maxDays", "warningDaysBefore", "graceLoginCount"],
  [CredentialPolicyTypeEnum.INITIAL_PASSWORD]: ["length", "validHours"],
};

function toFormNumber(value: unknown): number | undefined {
  if (typeof value !== "number" && typeof value !== "string") return undefined;
  if (typeof value === "string" && value.trim() === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

/** 兼容历史配置中的数字字符串，避免向数字控件传入字符串或 NaN。 */
export function normalizeCredentialFormValues(
  policyType: CredentialPolicyTypeEnum,
  config: Record<string, unknown>,
): Record<string, unknown> {
  const form = { ...config };
  for (const field of NUMERIC_FIELDS[policyType]) {
    if (field in config) form[field] = toFormNumber(config[field]);
  }
  return form;
}
