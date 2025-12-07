import { newEnumExt } from "../common";

export enum SocialTypeEnums {
  WECHAT_MINI_PROGRAM = "wechat_miniprogram",
}
export const SocialTypeEnumsEnumExtArray = [
  newEnumExt(SocialTypeEnums.WECHAT_MINI_PROGRAM, "微信小程序", "success"),
];
export const useSocialTypeEnumsEnum = () => {
  return useEnum<string>(SocialTypeEnumsEnumExtArray);
};
