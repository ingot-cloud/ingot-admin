import framedLight from "@/assets/logo/in-light-framed.svg";
import framedDark from "@/assets/logo/in-dark-framed.svg";

export const resolveAppBarLogo = (customLogo: string | undefined, isDark: boolean): string => {
  if (customLogo) {
    return customLogo;
  }
  return isDark ? framedDark : framedLight;
};
