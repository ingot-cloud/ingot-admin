import type { CommonStatus } from "./enums";

export interface PlatformResource {
  id?: string;
  appId?: string;
  code?: string;
  name?: string;
  status?: CommonStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppResourceCreateDTO {
  code?: string;
  name?: string;
  status?: CommonStatus;
}

export interface AppResourceUpdateDTO {
  name?: string;
  status?: CommonStatus;
}
