import framedLight from "@ingot/appearance/assets/logo/in-light-framed.svg";
import framedDark from "@ingot/appearance/assets/logo/in-dark-framed.svg";

export const resolveAppBarLogo = (customLogo: string | undefined, isDark: boolean): string => {
  if (customLogo) {
    return customLogo;
  }
  return isDark ? framedDark : framedLight;
};
