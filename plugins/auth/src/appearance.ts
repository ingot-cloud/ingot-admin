import { onScopeDispose, watchEffect } from "vue";
import { useDark } from "@vueuse/core";
import logoLight from "@ingot/appearance/assets/logo/in-light-framed.svg";
import logoDark from "@ingot/appearance/assets/logo/in-dark-framed.svg";

/** 登录页配色策略：跟随系统、固定浅色或固定深色。 */
export type AuthColorScheme = "auto" | "light" | "dark";

/**
 * 初始化登录页配色与品牌页签图标，配色由应用配置决定。
 * @param colorScheme 配色策略，未配置或运行时值非法时使用 light。
 */
export function useAuthAppearance(colorScheme: AuthColorScheme = "light"): void {
  const root = document.documentElement;
  const wasDark = root.classList.contains("dark");
  const previousAuth = root.dataset.inAuth;
  const previousIcon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  const previousHref = previousIcon?.getAttribute("href");
  const previousType = previousIcon?.getAttribute("type");
  root.dataset.inAuth = "";
  onScopeDispose(() => {
    root.classList.toggle("dark", wasDark);
    if (previousAuth === undefined) delete root.dataset.inAuth;
    else root.dataset.inAuth = previousAuth;
    if (previousIcon) {
      if (previousHref === null || previousHref === undefined) previousIcon.removeAttribute("href");
      else previousIcon.setAttribute("href", previousHref);
      if (previousType === null || previousType === undefined) previousIcon.removeAttribute("type");
      else previousIcon.setAttribute("type", previousType);
    }
  });
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
