import type { Component } from "vue";
import BizDeptSelect from "./biz/dept-select/BizDeptSelect.vue";

export const domainGlobalComponents: Record<string, Component> = {
  BizDeptSelect,
};

declare module "vue" {
  export interface GlobalComponents {
    BizDeptSelect: typeof BizDeptSelect;
  }
}
