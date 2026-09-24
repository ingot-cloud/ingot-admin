import type { AppActionCatalogView, AppMenuActionRecord } from "@ingot/admin-common";
import {
  PlatformActionCatalogAPI,
  PlatformMenuActionsAPI,
} from "@/api/iam/catalog";
import type { ActionCatalog, MenuActionOption } from "./menuActions";

const toCatalog = (view: AppActionCatalogView): ActionCatalog => ({
  applicationId: view.applicationId,
  applicationName: view.applicationName,
  resources: view.resources.map((resource) => ({
    id: resource.id,
    name: resource.name,
    code: resource.code,
    actions: resource.actions.map((action) => ({
      id: action.id,
      name: action.name,
      code: action.code,
      resourceId: resource.id,
      resourceName: resource.name,
      applicationId: view.applicationId,
      applicationName: view.applicationName,
    })),
  })),
});

export async function loadApplicationCatalog(applicationId: string): Promise<ActionCatalog> {
  const response = await PlatformActionCatalogAPI(applicationId);
  return toCatalog(response.data);
}

export function menuActionsFromRecords(
  records: AppMenuActionRecord[],
  applicationId: string,
  applicationName: string,
): MenuActionOption[] {
  return records.map((item) => ({
    id: item.id,
    name: item.name,
    code: item.code,
    resourceId: item.resourceId,
    resourceName: item.resourceName,
    applicationId,
    applicationName,
  }));
}

export async function loadMenuAssociatedActions(
  applicationId: string,
  menuId: string,
  applicationName: string,
): Promise<MenuActionOption[]> {
  const response = await PlatformMenuActionsAPI(applicationId, menuId);
  return menuActionsFromRecords(response.data ?? [], applicationId, applicationName);
}
