import type { BreadCrumbRecord } from "./types";

export interface BreadcrumbRouteMatch {
  path: string;
  meta?: {
    title?: string;
    icon?: string;
    hideBreadcrumb?: boolean;
  };
  redirect?: unknown;
  children?: Array<{
    path: string;
    meta?: { title?: string; icon?: string };
    redirect?: unknown;
  }>;
}

export const buildBreadcrumbList = (
  matched: Array<BreadcrumbRouteMatch>,
): Array<BreadCrumbRecord> => {
  const list: Array<BreadCrumbRecord> = [];

  matched
    .filter((item) => !item.meta || !item.meta.hideBreadcrumb)
    .forEach((item) => {
      list.push({
        path: item.path,
        title: item.meta?.title || "",
        icon: item.meta?.icon,
        redirect: item.redirect?.toString(),
        children: item.children?.map((child) => {
          return {
            path: child.path,
            title: child.meta?.title || "",
            icon: child.meta?.icon,
            redirect: child.redirect?.toString(),
          };
        }),
      });
    });

  const cLen = list.length;
  if (cLen === 0) {
    return list;
  }

  const path = list[cLen - 1].path;
  if (cLen > 1 && list[cLen - 2].redirect === path && list[cLen - 2].children?.length === 1) {
    list[cLen - 1].icon = list[cLen - 2].icon;
    list.splice(cLen - 2, 1);
  }

  return list;
};

export const isBreadcrumbVisible = (
  showBreadcrumb: boolean | undefined,
  matched: Array<BreadcrumbRouteMatch>,
): boolean => Boolean(showBreadcrumb) && buildBreadcrumbList(matched).length > 1;
