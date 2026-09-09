import { computed, inject, type ComputedRef } from "vue";
import type { InAppBarUtilityAction } from "@/components/types";
import { adminAppOptionsKey } from "@/config";
import type { InAdminHeaderConfig } from "@/plugin/header";
import { adaptLegacyUtilities } from "./adaptLegacyUtilities";
import { resolveHeaderConfig, type ResolvedHeaderConfig } from "./resolveHeaderConfig";

export const useResolvedHeader = (
  headerProp: () => InAdminHeaderConfig | undefined,
  utilitiesProp: () => InAppBarUtilityAction[] | undefined,
): ComputedRef<ResolvedHeaderConfig> => {
  const options = inject(adminAppOptionsKey, null);
  const compact = useMediaQuery("(max-width: 1279px)");

  return computed(() => {
    const header = headerProp() ?? options?.header;
    const resolved = resolveHeaderConfig(header);
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
