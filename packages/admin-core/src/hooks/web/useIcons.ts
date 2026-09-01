import { getAdminRuntimeConfig } from "@/runtime";

export const useIconsCollection = () => {
  const files = import.meta.glob("../../assets/icons/*.svg", { eager: true });
  const symbol = getAdminRuntimeConfig().branding.symbol;

  return Object.keys(files).map((fileName) => {
    const name = fileName.split("/").pop()?.replace(".svg", "") ?? "";
    return `${symbol}:${name}`;
  });
};
