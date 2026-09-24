import { listRegisteredViews } from "@ingot/admin-core";

export interface ViewPathOptionGroup {
  label: string;
  options: Array<{ label: string; value: string }>;
}

export function viewPathOptionGroups(): ViewPathOptionGroup[] {
  const views = listRegisteredViews();
  const groups: ViewPathOptionGroup[] = [];
  const layouts = views.filter((view) => view.kind === "layout");
  if (layouts.length > 0) {
    groups.push({
      label: "布局",
      options: layouts.map((view) => ({ label: view.key, value: view.key })),
    });
  }
  const pagesByPlugin = new Map<string, string[]>();
  views
    .filter((view) => view.kind === "page")
    .forEach((view) => {
      const keys = pagesByPlugin.get(view.pluginId) ?? [];
      keys.push(view.key);
      pagesByPlugin.set(view.pluginId, keys);
    });
  pagesByPlugin.forEach((keys, pluginId) => {
    groups.push({
      label: `页面 · ${pluginId}`,
      options: keys.map((key) => ({ label: key, value: key })),
    });
  });
  return groups;
}
