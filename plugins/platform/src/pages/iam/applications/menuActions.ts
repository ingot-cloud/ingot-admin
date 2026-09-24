export interface MenuActionOption {
  id: string;
  name: string;
  code: string;
  resourceId: string;
  resourceName: string;
  applicationId: string;
  applicationName: string;
}

export interface ActionResourceGroup {
  resourceId: string;
  resourceName: string;
  actions: MenuActionOption[];
}

export interface ActionAppGroup {
  applicationId: string;
  applicationName: string;
  resources: ActionResourceGroup[];
}

export interface ActionCatalogResource {
  id: string;
  name: string;
  code?: string;
  actions: MenuActionOption[];
}

export interface ActionCatalog {
  applicationId: string;
  applicationName: string;
  resources: ActionCatalogResource[];
}

export function groupMenuActions(actions: MenuActionOption[]): ActionAppGroup[] {
  const apps = new Map<string, ActionAppGroup>();
  for (const action of actions) {
    let app = apps.get(action.applicationId);
    if (!app) {
      app = {
        applicationId: action.applicationId,
        applicationName: action.applicationName || action.applicationId,
        resources: [],
      };
      apps.set(action.applicationId, app);
    }
    let resource = app.resources.find((item) => item.resourceId === action.resourceId);
    if (!resource) {
      resource = {
        resourceId: action.resourceId,
        resourceName: action.resourceName || action.resourceId,
        actions: [],
      };
      app.resources.push(resource);
    }
    resource.actions.push(action);
  }
  return [...apps.values()];
}

export function buildActionCatalog(input: {
  applicationId: string;
  applicationName: string;
  resources: Array<{ id: string; name: string; code?: string }>;
  actions: MenuActionOption[];
}): ActionCatalog {
  const byResource = new Map<string, MenuActionOption[]>();
  for (const action of input.actions) {
    const list = byResource.get(action.resourceId) ?? [];
    list.push(action);
    byResource.set(action.resourceId, list);
  }
  return {
    applicationId: input.applicationId,
    applicationName: input.applicationName,
    resources: input.resources.map((resource) => ({
      id: resource.id,
      name: resource.name,
      code: resource.code,
      actions: byResource.get(resource.id) ?? [],
    })),
  };
}

export function actionsOfCatalog(catalog: ActionCatalog, ids?: string[]): MenuActionOption[] {
  const wanted = ids ? new Set(ids) : undefined;
  return catalog.resources.flatMap((resource) =>
    resource.actions.filter((item) => !wanted || wanted.has(item.id)),
  );
}

export function filterActionCatalog(catalog: ActionCatalog, keyword: string): ActionCatalog {
  const query = keyword.trim().toLowerCase();
  if (!query) {
    return catalog;
  }
  const resourceMatched = (name: string): boolean => name.toLowerCase().includes(query);
  return {
    ...catalog,
    resources: catalog.resources
      .map((resource) => {
        if (resourceMatched(resource.name) || resourceMatched(resource.code ?? "")) {
          return resource;
        }
        return {
          ...resource,
          actions: resource.actions.filter(
            (action) => action.name.toLowerCase().includes(query) || action.code.toLowerCase().includes(query),
          ),
        };
      })
      .filter((resource) => resource.actions.length > 0),
  };
}
