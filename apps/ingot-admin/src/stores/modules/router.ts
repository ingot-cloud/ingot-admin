import type { RouteRecordRaw } from "vue-router";
import type { MenuRouteRecord } from "@/layouts";
import { default as routes } from "@/router/routes";
import { UserMenuAPI } from "@/api/common/user";
import { generateMenus, transformMenu, cacheRoutes } from "@/router/helper/route";
import { usePermissions } from "./auth";

export const useRouterStore = defineStore("router", () => {
  const permissions = usePermissions();
  const allRoutes = ref<Array<RouteRecordRaw>>([]);
  const dynamicRoutes = ref<Array<RouteRecordRaw>>([]);
  const menus = ref<Array<MenuRouteRecord>>([]);
  const cacheNames = ref<Array<string>>([]);

  const getMenus = computed(() => menus.value);

  const fetchRoutes = async (forceRefresh?: boolean) => {
    return new Promise<{
      menus: Array<MenuRouteRecord>;
      dynamicRoutes: Array<RouteRecordRaw>;
    }>((resolve) => {
      if (forceRefresh || menus.value.length === 0) {
        UserMenuAPI()
          .then((response) => {
            permissions.updateAuthorities(response.data);
            dynamicRoutes.value = transformMenu(response.data);
            allRoutes.value = routes.concat(dynamicRoutes.value);
            menus.value = generateMenus(allRoutes.value);
            cacheNames.value = cacheRoutes;
            resolve({
              menus: menus.value,
              dynamicRoutes: dynamicRoutes.value,
            });
          })
          .catch(() => {
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

  return { menus, cacheNames, getMenus, fetchRoutes };
});
