import type { CommonStatus, SocialTypeEnums } from "./enums";

export interface SysSocialDetails {
  id?: string;
  appId?: string;
  appSecret?: string;
  redirectUrl?: string;
  name?: string;
  type?: SocialTypeEnums;
  status?: CommonStatus;
  createdAt?: string;
  updatedAt?: string;
}
