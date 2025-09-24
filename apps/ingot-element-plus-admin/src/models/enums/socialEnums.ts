import { newEnumExt } from "../common";

export enum SocialTypeEnums {
  ADMIN_SMS = "admin_sms",
  ADMIN_WECHAT = "admin_wechat",
  ADMIN_MINI_PROGRAM = "admin_miniprogram",
  APP_SMS = "app_sms",
  APP_WECHAT = "app_wechat",
  APP_MINI_PROGRAM = "app_miniprogram",
}
export const SocialTypeEnumsEnumExtArray = [
  newEnumExt(SocialTypeEnums.ADMIN_SMS, "后台短信登录", "success"),
  newEnumExt(SocialTypeEnums.ADMIN_WECHAT, "后台微信登录", "warning"),
  newEnumExt(SocialTypeEnums.ADMIN_MINI_PROGRAM, "后台微信小程序", "danger"),
  newEnumExt(SocialTypeEnums.APP_SMS, "前台短信登录", "success"),
  newEnumExt(SocialTypeEnums.APP_WECHAT, "前台微信登录", "warning"),
  newEnumExt(SocialTypeEnums.APP_MINI_PROGRAM, "前台微信小程序", "danger"),
];
export const useSocialTypeEnumsEnum = () => {
  return useEnum<string>(SocialTypeEnumsEnumExtArray);
};
