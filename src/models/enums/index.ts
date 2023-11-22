import { newEnumExt } from "../common";

export * from "./commonEnums";
export * from "./deptEnums";
export * from "./storageEnums";
export * from "./clientEnums";
export * from "./menuEnums";
export * from "./socialEnums";

export enum OrgTypeEnums {
  System = "0",
  Tenant = "1",
  Custom = "9",
}
export const OrgTypeEnumsExtArray = [
  newEnumExt(OrgTypeEnums.System, "系统默认", "danger"),
  newEnumExt(OrgTypeEnums.Tenant, "组织", "success"),
  newEnumExt(OrgTypeEnums.Custom, "自定义", "warning"),
];
export const useOrgTypeEnums = () => {
  return useEnum(OrgTypeEnumsExtArray);
};
