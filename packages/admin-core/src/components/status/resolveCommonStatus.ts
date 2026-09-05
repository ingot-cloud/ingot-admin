import { CommonStatus } from "@/models/enums";

/**
 * 只识别公共 `status` 枚举（含数字码）。无法识别时返回 undefined，标签不渲染。
 * 账号可用/锁定请使用 InAccountStatusTag 的 `enabled` / `locked`。
 */
export const resolveCommonStatus = (
  status?: CommonStatus | string | number | null,
): CommonStatus | undefined => {
  if (status === undefined || status === null || status === "") {
    return undefined;
  }
  const value = String(status);
  if (value === CommonStatus.Enable) {
    return CommonStatus.Enable;
  }
  if (value === CommonStatus.Lock) {
    return CommonStatus.Lock;
  }
  return undefined;
};
