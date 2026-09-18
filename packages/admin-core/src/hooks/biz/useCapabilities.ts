import { storeToRefs } from "pinia";
import { usePermissions } from "@/stores/modules/auth";

export const useCapabilities = () => {
  const store = usePermissions();
  const { permissions, unavailable, version, expiresAt, contextEpoch } = storeToRefs(store);

  const hasAction = (code: string): boolean => {
    if (unavailable.value) {
      return false;
    }
    return permissions.value.includes(code);
  };

  const objectAllowed = (
    capabilities: Record<string, { allowed?: boolean; message?: string }> | undefined,
    code: string,
  ): { allowed: boolean; message?: string } => {
    if (!hasAction(code)) {
      return { allowed: false };
    }
    const item = capabilities?.[code];
    return {
      allowed: item?.allowed === true,
      message: item?.message,
    };
  };

  return {
    actionCodes: permissions,
    unavailable,
    version,
    expiresAt,
    contextEpoch,
    hasAction,
    objectAllowed,
  };
};
