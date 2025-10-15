import { newEnumExt } from "../common";

/**
 * Token认证方法
 */
export enum TokenAuthMethod {
  Unique = "1",
  Standard = "0",
}
export const TokenAuthMethodEnumExtArray = [
  newEnumExt(TokenAuthMethod.Unique, "唯一", "warning"),
  newEnumExt(TokenAuthMethod.Standard, "标准", "danger"),
];
export const useTokenAuthMethodEnum = () => {
  return useEnum(TokenAuthMethodEnumExtArray);
};

/**
 * 允许的授权类型
 */
export enum AuthorizedGrantType {
  Password = "password",
  Social = "social",
  RefreshToken = "refresh_token",
  Client = "client_credentials",
  Code = "authorization_code",
  PreAuthorizationCode = "pre_authorization_code",
}
export const AuthorizedGrantTypeEnumExtArray = [
  newEnumExt(AuthorizedGrantType.Code, "授权码模式"),
  newEnumExt(AuthorizedGrantType.Password, "密码模式"),
  newEnumExt(AuthorizedGrantType.Social, "社交模式"),
  newEnumExt(AuthorizedGrantType.Client, "客户端模式"),
  newEnumExt(AuthorizedGrantType.RefreshToken, "允许刷新Token"),
  newEnumExt(AuthorizedGrantType.PreAuthorizationCode, "预授权模式"),
];
export const useAuthorizedGrantTypeEnum = () => {
  return useEnum(AuthorizedGrantTypeEnumExtArray);
};

/**
 * 客户端认证方法
 */
export enum ClientAuthMethod {
  CLIENT_SECRET_BASIC = "client_secret_basic",
  CLIENT_SECRET_POST = "client_secret_post",
  CLIENT_SECRET_JWT = "client_secret_jwt",
  PRIVATE_KEY_JWT = "private_key_jwt",
  NONE = "none",
  PRE_AUTH = "pre_auth",
}
export const ClientAuthMethodEnumExtArray = [
  newEnumExt(ClientAuthMethod.CLIENT_SECRET_BASIC, "Client Secret Basic"),
  newEnumExt(ClientAuthMethod.CLIENT_SECRET_POST, "Client Secret Post"),
  newEnumExt(ClientAuthMethod.CLIENT_SECRET_JWT, "Client Secret JWT"),
  newEnumExt(ClientAuthMethod.PRIVATE_KEY_JWT, "Private Key JWT"),
  newEnumExt(ClientAuthMethod.NONE, "None"),
  newEnumExt(ClientAuthMethod.PRE_AUTH, "预授权"),
];
export const useClientAuthMethodEnum = () => {
  return useEnum(ClientAuthMethodEnumExtArray);
};
