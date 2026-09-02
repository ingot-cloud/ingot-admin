import { newEnumExt, useEnum } from "@ingot/admin-core";

export enum RoleTypeEnums {
  ROLE = "0",
  GROUP = "1",
}

export const RoleTypeEnumsExtArray = [
  newEnumExt(RoleTypeEnums.ROLE, "角色", "danger"),
  newEnumExt(RoleTypeEnums.GROUP, "角色组", "success"),
];

export const useRoleTypeEnums = () => {
  return useEnum(RoleTypeEnumsExtArray);
};
