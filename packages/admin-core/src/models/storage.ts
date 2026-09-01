import type { StoreType } from "./enums";

export interface StoreParams {
  key: string;
  value: string | any;
  type?: StoreType;
}

export interface CookieParams {
  key: string;
  value: string | any;
  expires?: number; // 单位秒
  path?: string;
}
