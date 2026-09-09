import type { InAppBarUtilityAction } from "@/components/types";
import {
  InAdminHeaderBuiltinUtilityName,
  InAdminHeaderUtilityItemType,
  type InAdminHeaderUtilityItem,
} from "@/plugin/header";
import { DEFAULT_HEADER_UTILITIES } from "./defaults";

const BUILTIN_KEYS = new Set<string>(Object.values(InAdminHeaderBuiltinUtilityName));

const showBuiltin = (key: string, utilities: InAppBarUtilityAction[]): boolean => {
  const configured = utilities.find((item) => item.key === key);
  return configured?.featureFlag !== false;
};

export const adaptLegacyUtilities = (
  utilities: InAppBarUtilityAction[],
  compact: boolean,
): InAdminHeaderUtilityItem[] => {
  const extras: InAdminHeaderUtilityItem[] = utilities
    .filter((item) => {
      if (BUILTIN_KEYS.has(item.key)) {
        return false;
      }
      if (item.featureFlag === false) {
        return false;
      }
      if (!item.onClick) {
        return false;
      }
      if (compact && (item.priority ?? 0) < 40) {
        return false;
      }
      return true;
    })
    .map((item) => ({
      type: InAdminHeaderUtilityItemType.Action,
      key: item.key,
      label: item.label,
      icon: item.icon,
      badge: item.badge,
      onClick: item.onClick ?? (() => undefined),
    }));

  const builtins = DEFAULT_HEADER_UTILITIES.filter(
    (item) => item.type === InAdminHeaderUtilityItemType.Builtin && showBuiltin(item.key, utilities),
  );

  return [...extras, ...builtins];
};
