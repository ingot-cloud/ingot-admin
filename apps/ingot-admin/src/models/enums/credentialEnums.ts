import { newEnumExt } from "../common";
export enum CredentialPolicyTypeEnum {
  STRENGTH = "1",
  HISTORY = "2",
  EXPIRATION = "3"
}
export const CredentialPolicyTypeEnumExtArray = [
  newEnumExt(CredentialPolicyTypeEnum.STRENGTH, "密码强度", "danger"),
  newEnumExt(CredentialPolicyTypeEnum.HISTORY, "密码历史", "success"),
  newEnumExt(CredentialPolicyTypeEnum.EXPIRATION, "密码过期", "warning"),
];
export const useCredentialPolicyTypeEnum = () => {
  return useEnum(CredentialPolicyTypeEnumExtArray);
};
