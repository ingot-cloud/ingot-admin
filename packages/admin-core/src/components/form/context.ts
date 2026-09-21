import type { ComputedRef, InjectionKey, Ref } from "vue";

export interface InFormContext {
  editing: Ref<boolean> | ComputedRef<boolean>;
}

export const inFormContextKey: InjectionKey<InFormContext> = Symbol("inFormContext");
