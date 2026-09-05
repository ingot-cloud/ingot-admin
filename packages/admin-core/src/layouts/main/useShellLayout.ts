import { useAppStateStore } from "@/stores/modules/app";
import type { ShellLayoutApi } from "./types";
import { SHELL_BREAKPOINT_NARROW } from "./types";

export const useShellLayout = (): ShellLayoutApi => {
  const appStateStore = useAppStateStore();
  const overlayQuery = useMediaQuery(`(max-width: ${SHELL_BREAKPOINT_NARROW - 1}px)`);
  const overlayOpen = ref(false);

  const isOverlay = computed(() => overlayQuery.value);
  const navigationMode = computed(() => {
    if (isOverlay.value) {
      return "overlay" as const;
    }
    return appStateStore.getMenuOpened ? ("expanded" as const) : ("collapsed" as const);
  });
  const sidebarExpanded = computed(() => {
    if (isOverlay.value) {
      return overlayOpen.value;
    }
    return Boolean(appStateStore.getMenuOpened);
  });

  watch(isOverlay, (overlay) => {
    if (overlay) {
      overlayOpen.value = false;
    }
  });

  const toggleSidebar = () => {
    if (isOverlay.value) {
      overlayOpen.value = !overlayOpen.value;
      return;
    }
    appStateStore.toggleMenu();
  };

  const closeOverlay = () => {
    overlayOpen.value = false;
  };

  return {
    navigationMode,
    isOverlay,
    overlayOpen,
    sidebarExpanded,
    toggleSidebar,
    closeOverlay,
  };
};
