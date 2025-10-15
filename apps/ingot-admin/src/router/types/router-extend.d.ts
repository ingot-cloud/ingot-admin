import "vue-router";

// Ensure this file is parsed as a module regardless of dependencies.
export {};

declare module "vue-router" {
  interface RouteMeta {
    /**
     * 路由名称
     */
    title?: string;
    /**
     * icon
     */
    icon?: string;
    /**
     * 是否放行，即忽略身份验证
     */
    permitAuth?: boolean;
    /**
     * 是否隐藏菜单
     */
    hideMenu?: boolean;
    /**
     * 隐藏面包屑
     */
    hideBreadcrumb?: boolean;
    /**
     * 是否为固钉
     */
    isAffix?: boolean;
    /**
     * 是否需要获取动态路由信息
     */
    dynamicRoutes?: boolean;
    /**
     * 是否手动处理全局loading
     */
    manualCloseGlobalLoading?: boolean;
    /**
     * 链接url
     */
    linkURL?: string;
  }

  interface _RouteLocationBase {
    /**
     * @Deprecated 不推荐使用该属性
     * 跳过之后所有 NavigationGuard 中执行的逻辑
     */
    skipAfterGuard: boolean;
  }
}
