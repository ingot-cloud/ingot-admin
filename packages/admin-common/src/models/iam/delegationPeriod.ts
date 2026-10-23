import { durationHours } from "./duration";

/** 委派时间边界可留空，但单次分配最长时间必须为正。 */
export const delegationPeriodError = (
  validFrom?: string,
  validUntil?: string,
  maxAssignmentDuration?: string,
  mode: "LIMITED" | "UNLIMITED" = "LIMITED",
): string | undefined => {
  const hours = durationHours(maxAssignmentDuration);
  if (mode === "LIMITED" && (!maxAssignmentDuration || !Number.isFinite(hours) || hours <= 0)) {
    return "请填写大于 0 的单次分配最长时间";
  }
  if (
    (validFrom && !Number.isFinite(Date.parse(validFrom))) ||
    (validUntil && !Number.isFinite(Date.parse(validUntil)))
  ) {
    return "请检查委派生效时间和失效时间";
  }
  if (validFrom && validUntil && Date.parse(validFrom) >= Date.parse(validUntil)) {
    return "委派失效时间必须晚于生效时间";
  }
  return undefined;
};

/** 来源委派对单次分配的约束；`maxDuration` 为空表示不限单次时长。 */
export interface AssignmentWindowLimit {
  validFrom?: string;
  validUntil?: string;
  maxDuration?: string;
}

/** 分配有效期须晚于生效时间，并落在来源委派期限和单次最长时长内。 */
export function assignmentWindowIssue(
  validFrom?: string,
  validUntil?: string,
  limit?: AssignmentWindowLimit,
  now = Date.now(),
): string | undefined {
  const from = validFrom ? Date.parse(validFrom) : now;
  const until = validUntil ? Date.parse(validUntil) : undefined;
  if (!Number.isFinite(from) || (until !== undefined && (!Number.isFinite(until) || until <= from)))
    return "失效时间必须晚于生效时间";
  if (!limit) return;
  if (limit.validFrom && from < Date.parse(limit.validFrom)) return "生效时间不能早于来源委派";
  if (limit.validUntil && (until === undefined || until > Date.parse(limit.validUntil)))
    return "失效时间不能超出来源委派";
  if (limit.maxDuration) {
    if (until === undefined) return "来源委派限制单次分配时长，请设置失效时间";
    if (until - from > durationHours(limit.maxDuration) * 3600000)
      return "分配有效期超过委派允许的单次最长时间";
  }
}
