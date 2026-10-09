import { MenuKind, MenuAccessMode } from "./constants";
import type { AppMenuDraft, MenuRouteParam } from "./types";

export const MENU_EDITOR_STEPS = [
  { title: "基本信息", description: "设置菜单和绑定视图" },
  { title: "访问控制", description: "配置准入及关联操作" },
  { title: "高级配置", description: "配置导航、缓存和参数" },
] as const;
export const MENU_PARAMETER_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;
export function resolveMenuPath(path?: string, params: MenuRouteParam[] = []): string {
  if (!params.length) return path ?? "";
  return `${(path ?? "").replace(/\/+$/, "")}${params.map((p) => `/:${p.name}`).join("")}`;
}
export interface MenuValidationError {
  step: number;
  field: string;
  message: string;
}
export function validateMenu(draft: AppMenuDraft): MenuValidationError[] {
  const errors: MenuValidationError[] = [];
  const add = (step: number, field: string, message: string): void => {
    errors.push({ step, field, message });
  };
  if (!draft.name.trim()) add(0, "name", "请输入菜单名称");
  const directory = draft.kind === MenuKind.DIRECTORY;
  if (!directory && draft.accessMode === MenuAccessMode.ACTION && !draft.actionIds.length)
    add(1, "actions", "受保护页面至少关联一个本应用操作");
  if (directory) return errors;
  if (draft.props) {
    if (!draft.hidden) add(2, "hidden", "带参页面必须隐藏导航入口");
    if (!draft.path?.startsWith("/") || /[:?#]/.test(draft.path))
      add(0, "path", "基础路径必须以 / 开始且不能包含动态占位符、查询或 hash");
    const params = draft.routeParams ?? [];
    if (!params.length) add(2, "params", "开启传递路由参数后至少声明一个参数");
    const names = new Set<string>();
    params.forEach((param, index) => {
      if (!MENU_PARAMETER_NAME.test(param.name) || names.has(param.name))
        add(2, `param-${index}`, "参数名需符合字母或下划线开头的命名规则且不能重复");
      names.add(param.name);
    });
  }
  return errors;
}
