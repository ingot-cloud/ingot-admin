import { IamBootstrapAPI } from "@/api/common/iam";
import type { RouteRecordRaw } from "vue-router";
import type { MenuRouteRecord } from "@/layouts";
import type { MenuTreeNode } from "@/models";
import { default as routes } from "@/router/routes";
import { generateMenus, transformMenu, cacheRoutes } from "@/router/helper/route";
import { mergeMenuTrees } from "@/router/helper/menus";
import { mapIamMenus } from "@/router/helper/iamMenus";
import { getAdminRuntimeConfig } from "@/runtime";

export const useRouterStore = defineStore("router", () => {
  const allRoutes = ref<Array<RouteRecordRaw>>([]);
  const dynamicRoutes = ref<Array<RouteRecordRaw>>([]);
  const menus = ref<Array<MenuRouteRecord>>([]);
  const cacheNames = ref<Array<string>>([]);

  const getMenus = computed(() => menus.value);

  const applyMergedMenus = (mergedMenus: ReturnType<typeof mergeMenuTrees>) => {
    dynamicRoutes.value = transformMenu(mergedMenus);
    allRoutes.value = routes.concat(dynamicRoutes.value);
    menus.value = generateMenus(allRoutes.value);
    cacheNames.value = cacheRoutes;
  };

  const applyRemoteMenus = (remoteMenus: Array<MenuTreeNode>): void => {
    const staticMenus = getAdminRuntimeConfig().staticMenus;
    applyMergedMenus(mergeMenuTrees(staticMenus, remoteMenus));
  };

  const fetchRoutes = async (forceRefresh?: boolean) => {
    return new Promise<{
      menus: Array<MenuRouteRecord>;
      dynamicRoutes: Array<RouteRecordRaw>;
    }>((resolve) => {
      if (forceRefresh || menus.value.length === 0) {
        const staticMenus = getAdminRuntimeConfig().staticMenus;
        IamBootstrapAPI()
          .then((response) => {
            applyRemoteMenus(mapIamMenus(response.data.menus));
            resolve({
              menus: menus.value,
              dynamicRoutes: dynamicRoutes.value,
            });
          })
          .catch(() => {
            if (staticMenus.length > 0 && menus.value.length === 0) {
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

  return { menus, cacheNames, getMenus, fetchRoutes, applyRemoteMenus };
});
