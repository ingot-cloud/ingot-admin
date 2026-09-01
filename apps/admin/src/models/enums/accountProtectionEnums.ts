import { newEnumExt } from "@ingot/admin-core";

export enum AccountProtectionTabEnum {
  LOCKOUT = "lockout",
}

export const AccountProtectionTabEnumExtArray = [
  newEnumExt(AccountProtectionTabEnum.LOCKOUT, "账号锁定", "danger"),
];

export const useAccountProtectionTabEnum = () => useEnum(AccountProtectionTabEnumExtArray);
