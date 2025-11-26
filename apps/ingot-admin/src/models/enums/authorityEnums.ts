import { newEnumExt } from "../common";
export enum AuthorityTypeEnum {
  MENU = "0",
  API = "1",
}
export const AuthorityTypeEnumsExtArray = [
  newEnumExt(AuthorityTypeEnum.MENU, "菜单权限", "danger"),
  newEnumExt(AuthorityTypeEnum.API, "API权限", "success"),
];
export const useAuthorityTypeEnums = () => {
  return useEnum(AuthorityTypeEnumsExtArray);
};
