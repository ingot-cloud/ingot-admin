import { storeToRefs } from "pinia";
import { usePermissions } from "@/stores/modules/auth";
import { objectActionAllowed, type ObjectActionCapabilities, type ObjectActionDecision } from "./actionAccess";

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
    capabilities: ObjectActionCapabilities | undefined,
    code: string,
  ): ObjectActionDecision => {
    if (!hasAction(code)) {
      return { allowed: false };
    }
    return objectActionAllowed(capabilities, code);
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
