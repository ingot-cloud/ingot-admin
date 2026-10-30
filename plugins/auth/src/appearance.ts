import { watchEffect } from "vue";
import { useDark } from "@vueuse/core";
import logoLight from "@ingot/appearance/assets/logo/in-light-framed.svg";
import logoDark from "@ingot/appearance/assets/logo/in-dark-framed.svg";

/** 登录站配色策略：跟随系统、固定浅色或固定深色。 */
export type AuthColorScheme = "auto" | "light" | "dark";

/**
 * 初始化登录站配色与品牌页签图标，配色由应用配置决定。
 * @param colorScheme 配色策略，未配置或运行时值非法时使用 light。
 */
export function useAuthAppearance(colorScheme: AuthColorScheme = "light"): void {
  document.documentElement.dataset.inAuth = "";
  const initialValue = colorScheme === "auto" || colorScheme === "dark" ? colorScheme : "light";
  const isDark = useDark({
    selector: "html",
    attribute: "class",
    valueDark: "dark",
    valueLight: "",
    storageKey: null,
    initialValue,
  });

  watchEffect(() => {
    const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (favicon) {
      favicon.type = "image/svg+xml";
      favicon.href = isDark.value ? logoDark : logoLight;
    }
  });
}
