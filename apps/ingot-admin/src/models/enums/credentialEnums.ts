import { newEnumExt } from "../common";
export enum CredentialPolicyTypeEnum {
  STRENGTH = "1",
  HISTORY = "2",
  EXPIRATION = "3",
  INITIAL_PASSWORD = "4",
}
export const CredentialPolicyTypeEnumExtArray = [
  newEnumExt(CredentialPolicyTypeEnum.STRENGTH, "密码强度", "danger"),
  newEnumExt(CredentialPolicyTypeEnum.HISTORY, "密码历史", "success"),
  newEnumExt(CredentialPolicyTypeEnum.EXPIRATION, "密码过期", "warning"),
  newEnumExt(CredentialPolicyTypeEnum.INITIAL_PASSWORD, "初始密码", "primary"),
];
export const useCredentialPolicyTypeEnum = () => {
  return useEnum(CredentialPolicyTypeEnumExtArray);
};

export enum InitialPasswordGenerationEnum {
  RANDOM = "RANDOM",
  FIXED = "FIXED",
}
export const InitialPasswordGenerationEnumExtArray = [
  newEnumExt(InitialPasswordGenerationEnum.RANDOM, "随机生成", "primary"),
  newEnumExt(InitialPasswordGenerationEnum.FIXED, "统一默认密码", "info"),
];
export const useInitialPasswordGenerationEnum = () => {
  return useEnum(InitialPasswordGenerationEnumExtArray);
};
