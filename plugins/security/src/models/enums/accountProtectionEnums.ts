import { newEnumExt } from "@ingot/admin-core";

export enum AccountProtectionTabEnum {
  ADMIN_LOCKOUT = "admin-lockout",
  APP_LOCKOUT = "app-lockout",
}

export const AccountProtectionTabEnumExtArray = [
  newEnumExt(AccountProtectionTabEnum.ADMIN_LOCKOUT, "B 端锁定策略", "danger"),
  newEnumExt(AccountProtectionTabEnum.APP_LOCKOUT, "C 端锁定策略", "danger"),
];

export const useAccountProtectionTabEnum = () => useEnum(AccountProtectionTabEnumExtArray);
