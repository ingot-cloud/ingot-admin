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

export interface InDetailDrawerTabsContext {
  registerEditable: (name: string, editable: ComputedRef<boolean>) => void;
  unregisterEditable: (name: string) => void;
}

export const tabsRootContextKey: InjectionKey<InBizTabRootContext> =
  Symbol("InBizTabRootContextKey");

export const detailDrawerTabsKey: InjectionKey<InDetailDrawerTabsContext> =
  Symbol("InDetailDrawerTabsKey");
