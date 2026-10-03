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
