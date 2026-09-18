import { usePermissions } from "@ingot/admin-core";
import { CLIENT_QUERY_PERMISSION } from "./constants";

export const useCanQueryClient = () => {
  const permissionsStore = usePermissions();

  const canQueryClient = computed(() => {
    return permissionsStore.permissions.some((code) => CLIENT_QUERY_PERMISSION.startsWith(code));
  });

  return {
    canQueryClient,
  };
};
