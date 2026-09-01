import { usePermissions, useUserInfoStore } from "@ingot/admin-core";
import { CLIENT_QUERY_PERMISSION } from "./constants";

export const useCanQueryClient = () => {
  const permissionsStore = usePermissions();
  const { getIsSystemAdmin } = storeToRefs(useUserInfoStore());

  const canQueryClient = computed(() => {
    if (getIsSystemAdmin.value) {
      return true;
    }
    return permissionsStore.permissions.some((code) => CLIENT_QUERY_PERMISSION.startsWith(code));
  });

  return {
    canQueryClient,
  };
};
