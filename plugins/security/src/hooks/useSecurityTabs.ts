import { computed, inject, provide, ref, watch, type InjectionKey, type Ref } from "vue";
import { useCapabilities } from "@ingot/admin-core";
const ACTIVE_TAB: InjectionKey<Ref<string>> = Symbol("security-active-tab");
import { SecurityAction } from "@/models/securityActions";
export { SecurityAction };
export function useSecurityTabs(
  options: { value: string; label: string }[],
  actions: Record<string, string>,
) {
  const { hasAction } = useCapabilities();
  const allowed = (tab: string): boolean => !!actions[tab] && hasAction(actions[tab]);
  const tabs = computed(() =>
    options
      .filter((item) => allowed(item.value))
      .map((item) => ({ id: item.value, title: item.label })),
  );
  const activeTab = ref("");
  const visitedTabs = ref<Record<string, boolean>>({});
  watch(
    tabs,
    (list) => {
      if (!list.some((item) => item.id === activeTab.value)) activeTab.value = list[0]?.id ?? "";
    },
    { immediate: true },
  );
  watch(
    activeTab,
    (tab) => {
      if (tab) visitedTabs.value[tab] = true;
    },
    { immediate: true },
  );
  provide(ACTIVE_TAB, activeTab);
  return { tabs, activeTab, visitedTabs, allowed };
}
export function useActiveSecurityRead(action: string, tab?: string) {
  const active = inject(ACTIVE_TAB, undefined);
  const { hasAction } = useCapabilities();
  return computed(() => hasAction(action) && (!tab || !active || active.value === tab));
}
