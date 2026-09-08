import type { Component, ComputedRef, InjectionKey } from "vue";
import type { InResolvedBrandingConfig } from "../runtime";
import { getAdminRuntimeConfig } from "../runtime";
import { adminAppOptionsKey } from "../config";
import { useAppStateStore } from "../stores/modules/app";
import { useRouterStore } from "../stores/modules/router";
import type { AdminShellSlot } from "../plugin";
import type { MenuRouteRecord } from "../layouts/types/menu";
import { useShellLayout } from "../layouts/main/useShellLayout";
import { shellLayoutKey, type ShellLayoutApi } from "../layouts/main/types";
import { isBreadcrumbVisible } from "../layouts/widgets/breadcrumb/buildBreadcrumbList";

export interface InAdminShellApi extends ShellLayoutApi {
  showBreadcrumb: ComputedRef<boolean>;
  showCopyright: ComputedRef<boolean>;
  showSearch: ComputedRef<boolean>;
  menus: ComputedRef<MenuRouteRecord[]>;
  branding: ComputedRef<InResolvedBrandingConfig>;
  shellSlots: ComputedRef<Partial<Record<AdminShellSlot, Component>>>;
  toggleNavigation: () => void;
}

export const adminShellKey: InjectionKey<InAdminShellApi> = Symbol("inAdminShell");

export const createAdminShell = (): InAdminShellApi => {
  const layout = useShellLayout();
  const route = useRoute();
  const appStateStore = useAppStateStore();
  const routerStore = useRouterStore();
  const options = inject(adminAppOptionsKey, null);

  const showCopyright = computed(() => Boolean(appStateStore.getShowCopyright));
  const showSearch = computed(() => Boolean(appStateStore.getShowSearch));
  const showBreadcrumb = computed(() =>
    isBreadcrumbVisible(appStateStore.getShowBreadcrumb, route.matched),
  );

  return {
    ...layout,
    showBreadcrumb,
    showCopyright,
    showSearch,
    menus: computed(() => routerStore.getMenus),
    branding: computed(() => getAdminRuntimeConfig().branding),
    shellSlots: computed(() => options?.shellSlots ?? {}),
    toggleNavigation: layout.toggleSidebar,
  };
};

export const provideAdminShell = (shell: InAdminShellApi): void => {
  provide(adminShellKey, shell);
  provide(shellLayoutKey, shell);
};

export const useAdminShell = (): InAdminShellApi => {
  const injected = inject(adminShellKey, null);
  if (!injected) {
    throw new Error("useAdminShell 必须在主题布局宿主内使用");
  }
  return injected;
};
