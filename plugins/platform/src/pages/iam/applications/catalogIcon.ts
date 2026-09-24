export const APP_ICON_DIR = "app/icon";

export function isCatalogImageIcon(value?: string): boolean {
  if (!value) {
    return false;
  }
  return value.startsWith("http://") || value.startsWith("https://") || value.includes("/");
}
