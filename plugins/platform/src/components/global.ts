import type { Component } from "vue";
import TenantOptions from "./biz/tenant-options/TenantOptions.vue";
import BizSearchUserByPhone from "./biz/search-user-by-phone/BizSearchUserByPhone.vue";

export const domainGlobalComponents: Record<string, Component> = {
  TenantOptions,
  BizSearchUserByPhone,
};

declare module "vue" {
  export interface GlobalComponents {
    TenantOptions: typeof TenantOptions;
    BizSearchUserByPhone: typeof BizSearchUserByPhone;
  }
}
