import { useToggle } from "@vueuse/core";
import type { ComputedRef, InjectionKey, WritableComputedRef } from "vue";
import { getAdminResolvedTheme } from "./applyTheme";
import { useAdminColorScheme } from "./colorScheme";
import { defaultAdminTheme } from "./defaultTheme";
import type { InResolvedAdminTheme } from "./types";

export const adminResolvedThemeKey: InjectionKey<InResolvedAdminTheme> =
  Symbol("inAdminResolvedTheme");

export interface InAdminThemeApi {
  themeId: ComputedRef<string>;
  themeName: ComputedRef<string>;
  isDark: WritableComputedRef<boolean>;
  toggleDark: (value?: boolean) => boolean;
}

const resolveBoundTheme = (): Pick<InResolvedAdminTheme, "id" | "name"> =>
  inject(adminResolvedThemeKey, null) ?? getAdminResolvedTheme() ?? defaultAdminTheme;

export const useAdminTheme = (): InAdminThemeApi => {
  const theme = resolveBoundTheme();
  const isDark = useAdminColorScheme();
  const toggleDark = useToggle(isDark);
  return {
    themeId: computed(() => theme.id),
    themeName: computed(() => theme.name),
    isDark,
    toggleDark,
  };
};
