import { newEnumExt } from "../common";
import type { ButtonStatusParams } from "../common";

/**
 * 公共状态
 */
export enum CommonStatus {
  // 可用
  Enable = "0",
  // 锁定
  Lock = "9",
}

export const CommonStatusEnumExtArray = [
  newEnumExt(CommonStatus.Enable, "正常", "success"),
  newEnumExt(CommonStatus.Lock, "锁定", "danger"),
];

export function getCommonStatusToggle(status: CommonStatus): CommonStatus {
  return status === CommonStatus.Enable ? CommonStatus.Lock : CommonStatus.Enable;
}

export function getCommonStatusActionDesc(status: CommonStatus): string {
  switch (status) {
    case CommonStatus.Enable:
      return "启用";
    case CommonStatus.Lock:
      return "锁定";
  }
}

export function getDisableButtonParams(status: CommonStatus): ButtonStatusParams {
  switch (status) {
    case CommonStatus.Enable:
      return {
        title: "锁定",
        type: "danger",
        icon: "ep:lock",
      };
    case CommonStatus.Lock:
      return {
        title: "解锁",
        type: "success",
        icon: "ep:unlock",
      };
  }
}
