export const ACTION_CODE_SEPARATOR = ":";

export function actionCodePrefix(applicationCode?: string, resourceCode?: string): string {
  if (!applicationCode || !resourceCode) {
    return "";
  }
  return `${applicationCode}${ACTION_CODE_SEPARATOR}${resourceCode}${ACTION_CODE_SEPARATOR}`;
}

export function actionCodeLocal(full: string, prefix: string): string {
  if (!full || !prefix || !full.startsWith(prefix)) {
    return full;
  }
  return full.slice(prefix.length);
}
