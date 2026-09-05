import { CommonStatus } from "@/models/enums";

/**
 * 列表接口可能给 `status`，也可能给 `enabled` / `locked`。
 * 无法识别时返回 undefined，标签不渲染。
 */
export const resolveCommonStatus = (
  status?: CommonStatus | string | number | null,
  flags?: { enabled?: boolean; locked?: boolean },
): CommonStatus | undefined => {
  if (status !== undefined && status !== null && status !== "") {
    const value = String(status);
    if (value === CommonStatus.Enable) {
      return CommonStatus.Enable;
    }
    if (value === CommonStatus.Lock) {
      return CommonStatus.Lock;
    }
  }
  if (flags?.locked) {
    return CommonStatus.Lock;
  }
  if (flags?.enabled === false) {
    return CommonStatus.Lock;
  }
  if (flags?.enabled === true) {
    return CommonStatus.Enable;
  }
  return undefined;
};
