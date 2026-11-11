import { IamBootstrapAPI } from "@/api/common/iam";
import type { Router, RouteRecordRaw } from "vue-router";
import type { MenuRouteRecord } from "@/layouts";
import type { MenuTreeNode } from "@/models";
import { default as routes } from "@/router/routes";
import { generateMenus, transformMenu, cacheRoutes } from "@/router/helper/route";
import { mergeMenuTrees } from "@/router/helper/menus";
import { mapIamMenus } from "@/router/helper/iamMenus";
import { getAdminRuntimeConfig } from "@/runtime";
import { MenuConfigurationError, navigationErrorLocation } from "@/router/navigationError";

export const useRouterStore = defineStore("router", () => {
  const cacheEpoch = ref(0);
  let fingerprint = "";
  let boundRouter: Router | undefined;
  let installedFingerprint: string | undefined;
  let removers: Array<() => void> = [];
  const installDynamicRoutes = (router: Router): void => {
    if (boundRouter === router && installedFingerprint === fingerprint) return;
    boundRouter = router;
    removers.forEach((remove) => remove());
    removers = dynamicRoutes.value.map((route) => router.addRoute(route));
    installedFingerprint = fingerprint;
  };
  const allRoutes = ref<Array<RouteRecordRaw>>([]);
  const dynamicRoutes = ref<Array<RouteRecordRaw>>([]);
  const menus = ref<Array<MenuRouteRecord>>([]);
  const cacheNames = ref<Array<string>>([]);
  const configurationError = shallowRef<MenuConfigurationError>();

  const getMenus = computed(() => menus.value);
  const activeApplicationId = ref<string>();
  const setActiveApplication = (id: string | undefined): void => {
    activeApplicationId.value = id;
  };

  const applyMergedMenus = (mergedMenus: ReturnType<typeof mergeMenuTrees>) => {
    const signature = JSON.stringify(mergedMenus);
    if (signature === fingerprint) return;
    const nextRoutes = transformMenu(mergedMenus);
    fingerprint = signature;
    cacheEpoch.value++;
    dynamicRoutes.value = nextRoutes;
    allRoutes.value = routes.concat(dynamicRoutes.value);
    menus.value = generateMenus(allRoutes.value);
    cacheNames.value = [...cacheRoutes];
    if (boundRouter) {
      installDynamicRoutes(boundRouter);
      const currentId = boundRouter.currentRoute.value.meta.menuId;
      const containsMenu = (items: Array<MenuTreeNode>): boolean =>
        items.some((item) => item.id === currentId || containsMenu(item.children ?? []));
      // 保留仍有权访问的活跃页完成菜单编辑；已撤销页面立即重新匹配。
      if (currentId && !containsMenu(mergedMenus))
        void boundRouter.replace(boundRouter.currentRoute.value.fullPath);
    }
  };

  const applyRemoteMenus = (remoteMenus: Array<MenuTreeNode>): void => {
    const staticMenus = getAdminRuntimeConfig().staticMenus;
    try {
      applyMergedMenus(mergeMenuTrees(staticMenus, remoteMenus));
      configurationError.value = undefined;
    } catch (error: unknown) {
      if (error instanceof MenuConfigurationError) {
        const returnTo = boundRouter?.currentRoute.value.fullPath;
        clearForPasswordChange();
        configurationError.value = error;
        if (boundRouter && returnTo) void boundRouter.replace(navigationErrorLocation(returnTo));
      }
      throw error;
    }
  };

  const clearForPasswordChange = (): void => {
    installedFingerprint = undefined;
    fingerprint = "";
    cacheEpoch.value++;
    removers.forEach((remove) => remove());
    removers = [];
    allRoutes.value = [];
    dynamicRoutes.value = [];
    menus.value = [];
    cacheNames.value = [];
    activeApplicationId.value = undefined;
    configurationError.value = undefined;
  };

  const fetchRoutes = async (forceRefresh?: boolean) => {
    return new Promise<{
      menus: Array<MenuRouteRecord>;
      dynamicRoutes: Array<RouteRecordRaw>;
    }>((resolve, reject) => {
      if (forceRefresh || fingerprint === "") {
        const epoch = cacheEpoch.value;
        const staticMenus = getAdminRuntimeConfig().staticMenus;
        IamBootstrapAPI()
          .then((response) => {
            if (epoch !== cacheEpoch.value) {
              resolve({ menus: menus.value, dynamicRoutes: dynamicRoutes.value });
              return;
            }
            applyRemoteMenus(mapIamMenus(response.data.menus));
            resolve({
              menus: menus.value,
              dynamicRoutes: dynamicRoutes.value,
            });
          })
          .catch((error: unknown) => {
            if (error instanceof MenuConfigurationError) {
              reject(error);
              return;
            }
            if (epoch === cacheEpoch.value && staticMenus.length > 0 && menus.value.length === 0) {
              applyMergedMenus(staticMenus);
            }
            resolve({
              menus: menus.value,
              dynamicRoutes: dynamicRoutes.value,
            });
          });
        return;
      }

      resolve({
        menus: menus.value,
        dynamicRoutes: dynamicRoutes.value,
      });
    });
  };

  return {
    cacheEpoch,
    configurationError,
    installDynamicRoutes,
    menus,
    cacheNames,
    getMenus,
    activeApplicationId,
    setActiveApplication,
    fetchRoutes,
    applyRemoteMenus,
    clearForPasswordChange,
  };
});
