import { newEnumExt, useEnum } from "@ingot/admin-core";

export enum TokenAuthMethod {
  Unique = "1",
  Standard = "0",
}

export const TokenAuthMethodEnumExtArray = [
  newEnumExt(TokenAuthMethod.Unique, "单会话", "warning"),
  newEnumExt(TokenAuthMethod.Standard, "多会话", "danger"),
];

export const useTokenAuthMethodEnum = () => {
  return useEnum(TokenAuthMethodEnumExtArray);
};
