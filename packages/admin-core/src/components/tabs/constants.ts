import type { ComputedRef, InjectionKey, Ref, VNode } from "vue";

export interface InBizTabPanelContext {
  uid: number;
  paneName: ComputedRef<string>;
  paneTitle: ComputedRef<string>;
  getVnode: () => VNode;
}

export interface InBizTabRootContext {
  currentName: Ref<string | number>;
  registerPane: (pane: InBizTabPanelContext) => void;
  unregisterPane: (uid: number) => void;
}

export const tabsRootContextKey: InjectionKey<InBizTabRootContext> =
  Symbol("InBizTabRootContextKey");
