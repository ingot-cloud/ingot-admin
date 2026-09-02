import type { DefineComponent } from "vue";

declare module "vue" {
  export interface GlobalComponents {
    InContainer: DefineComponent<object, object, unknown>;
    InPageHeader: DefineComponent<{ title?: string; subtitle?: string }, object, unknown>;
    ElCard: DefineComponent<object, object, unknown>;
    ElTag: DefineComponent<object, object, unknown>;
    ElButton: DefineComponent<object, object, unknown>;
    ElInput: DefineComponent<object, object, unknown>;
    ElStatistic: DefineComponent<object, object, unknown>;
    ElDescriptions: DefineComponent<object, object, unknown>;
    ElDescriptionsItem: DefineComponent<object, object, unknown>;
  }
}

export {};
