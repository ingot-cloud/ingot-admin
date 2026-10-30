import { computed, onActivated, onDeactivated, ref } from "vue";
import { useRoute } from "vue-router";
import { useQuery } from "@tanstack/vue-query";
import {
  REALTIME_QUERY_STALE_TIME,
  refreshSessionPermissions,
  silentQueryRequest,
  usePermissions,
  useRouterStore,
} from "@ingot/admin-core";
import { TenantWorkbenchStatisticsAPI } from "@/api/iam/workbench";
import { workbenchEntries } from "./table";

export const useOps = () => {
  const route = useRoute();
  const permissions = usePermissions();
  const menuStore = useRouterStore();
  const active = ref(true);
  const enabled = computed(
    () =>
      active.value &&
      permissions.domain === "TENANT" &&
      !!permissions.tenantId &&
      !!permissions.memberId &&
      !permissions.unavailable,
  );
  const query = useQuery(() => ({
    queryKey: [
      "iam-tenant",
      "workbench-statistics",
      permissions.domain,
      permissions.tenantId,
      permissions.memberId,
      permissions.contextEpoch,
      permissions.version,
    ],
    queryFn: async ({ signal }) =>
      (await TenantWorkbenchStatisticsAPI(silentQueryRequest(signal))).data,
    enabled: enabled.value,
    staleTime: REALTIME_QUERY_STALE_TIME,
    meta: { skipGlobalError: true },
  }));

  onActivated(() => {
    active.value = true;
  });
  onDeactivated(() => {
    active.value = false;
  });

  return {
    entries: computed(() =>
      permissions.unavailable ? [] : workbenchEntries(menuStore.getMenus, route.path),
    ),
    statistics: computed(() =>
      enabled.value && !query.isError.value ? query.data.value : undefined,
    ),
    loading: computed(() => enabled.value && query.isPending.value),
    failed: computed(() => permissions.unavailable || query.isError.value),
    retry: async (): Promise<void> => {
      if (permissions.unavailable) {
        try {
          await refreshSessionPermissions();
        } catch {
          return;
        }
      }
      if (enabled.value) void query.refetch();
    },
  };
};
