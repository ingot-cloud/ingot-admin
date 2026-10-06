import { computed, inject, watch, type ComputedRef } from "vue";
import type { InAppBarUtilityAction } from "@/components/types";
import { adminAppOptionsKey } from "@/config";
import { InAdminHeaderNavItemType, type InAdminHeaderConfig } from "@/plugin/header";
import { useRouter } from "vue-router";
import { usePermissions } from "@/stores/modules/auth";
import { useRouterStore } from "@/stores/modules/router";
import { applicationMenus, applicationForPath, navigableApplications, navigableApplicationPath } from "./applicationNavigation";
import { adaptLegacyUtilities } from "./adaptLegacyUtilities";
import { resolveHeaderConfig, type ResolvedHeaderConfig } from "./resolveHeaderConfig";

export const useResolvedHeader = (
  headerProp: () => InAdminHeaderConfig | undefined,
  utilitiesProp: () => InAppBarUtilityAction[] | undefined,
): ComputedRef<ResolvedHeaderConfig> => {
  const options = inject(adminAppOptionsKey, null);
  const permissions = usePermissions();
  const menus = useRouterStore();
  const router = useRouter();
  const applicationMode = computed(() => (headerProp() ?? options?.header)?.navigation?.source === "applications");
  const applications = computed(() => navigableApplications(permissions.applications, menus.getMenus));
  watch(() => [router?.currentRoute.value.path, router?.currentRoute.value.meta.applicationId,
    applications.value.map(app => app.id).join()] as const, () => {
    if (!applicationMode.value) return;
    const route = router?.currentRoute.value;
    const inferred = route?.meta.applicationId ?? applicationForPath(menus.getMenus, route?.path ?? "");
    const selected = applications.value.find(app => app.id === inferred)
      ?? applications.value.find(app => app.id === menus.activeApplicationId) ?? applications.value[0];
    menus.setActiveApplication(selected?.id);
  }, { immediate: true });
  const compact = useMediaQuery("(max-width: 1279px)");

  return computed(() => {
    const header = headerProp() ?? options?.header;
    const resolved = resolveHeaderConfig(header);
    if (applicationMode.value) {
      resolved.navigation.items = applications.value.map(app => ({
        key: app.id, label: app.name, icon: app.icon || "ep:monitor", disabled: false,
        type: InAdminHeaderNavItemType.Action, trigger: "click", groups: [],
      }));
      resolved.navigation.activeKey = menus.activeApplicationId;
      resolved.navigation.onSelect = ({ entryKey }) => {
        if (!applications.value.some(app => app.id === entryKey)) return;
        const path = navigableApplicationPath(applicationMenus(menus.getMenus, entryKey));
        if (path && router) void router.push(path);
      };
    }
    const utilities = utilitiesProp();
    if (utilities === undefined) {
      return resolved;
    }
    const adapted = adaptLegacyUtilities(utilities, Boolean(compact.value));
    return {
      ...resolved,
      utilities: resolveHeaderConfig({ utilities: adapted }).utilities,
    };
  });
};
