import type { Component, ComputedRef, InjectionKey } from "vue";
import type { InResolvedBrandingConfig } from "../runtime";
import { getAdminRuntimeConfig } from "../runtime";
import { adminAppOptionsKey } from "../config";
import { useAppStateStore } from "../stores/modules/app";
import { useRouterStore } from "../stores/modules/router";
import type { AdminShellSlot, InAdminHeaderConfig } from "../plugin";
import type { MenuRouteRecord } from "../layouts/types/menu";
import { useShellLayout } from "../layouts/main/useShellLayout";
import { shellLayoutKey, type ShellLayoutApi } from "../layouts/main/types";
import { isBreadcrumbVisible } from "../layouts/widgets/breadcrumb/buildBreadcrumbList";

/** 默认管理台外壳状态，供自定义主题部件读取。 */
export interface InAdminShellApi extends ShellLayoutApi {
  /** 当前路由是否展示面包屑 */
  showBreadcrumb: ComputedRef<boolean>;
  /** 是否展示页脚版权 */
  showCopyright: ComputedRef<boolean>;
  /** 是否展示顶栏搜索，来自设置项 `showSearch` */
  showSearch: ComputedRef<boolean>;
  /** 侧栏菜单树 */
  menus: ComputedRef<MenuRouteRecord[]>;
  /** 已解析的品牌信息 */
  branding: ComputedRef<InResolvedBrandingConfig>;
  /** APP 注入的外壳插槽 */
  shellSlots: ComputedRef<Partial<Record<AdminShellSlot, Component>>>;
  /**
   * APP 注入的顶栏原始配置，尚未解析响应式值。
   * 自定义顶栏排版前请先 `resolveHeaderConfig`。
   */
  header: ComputedRef<InAdminHeaderConfig | undefined>;
  /** 切换侧栏展开 / 收起 */
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
    header: computed(() => options?.header),
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
