import { newEnumExt } from "../common";

export enum OrgTypeEnums {
  System = "0",
  Tenant = "1",
}
export const OrgTypeEnumsExtArray = [
  newEnumExt(OrgTypeEnums.System, "平台", "danger"),
  newEnumExt(OrgTypeEnums.Tenant, "组织", "success"),
];
export const useOrgTypeEnums = () => {
  return useEnum(OrgTypeEnumsExtArray);
};
