import type { InTableAction, InTableActionOverflow } from "../types";

export const TOOLBAR_GAP = 12;
export const MORE_BUTTON_WIDTH = 32;

export interface RankedTableActions<Row = unknown> {
  inline: Array<InTableAction<Row>>;
  menu: Array<InTableAction<Row>>;
  showMore: boolean;
}

const isVisibleAction = <Row>(action: InTableAction<Row>, allowed: string[]): boolean => {
  const permission = action.permission;
  if (!permission) {
    return true;
  }
  return allowed.some((item) => permission === item || permission.startsWith(item));
};

export const filterActionsByPermission = <Row>(
  actions: Array<InTableAction<Row>>,
  allowedPermissions: string[],
): Array<InTableAction<Row>> => {
  return actions.filter((action) => isVisibleAction(action, allowedPermissions));
};

export const filterActionsByContext = <Row>(
  actions: Array<InTableAction<Row>>,
  options: { selectedCount?: number; variant: "row" | "toolbar" },
): Array<InTableAction<Row>> => {
  if (options.variant === "toolbar") {
    return actions;
  }
  return actions.filter((action) => action.group !== "batch");
};

export const resolveActionOverflow = <Row>(action: InTableAction<Row>): InTableActionOverflow => {
  if (action.overflow) {
    return action.overflow;
  }
  if (action.kind === "quick") {
    return "never";
  }
  return "auto";
};

export const actionPriority = <Row>(action: InTableAction<Row>): number => action.priority ?? 0;

const byPriorityAsc = <Row>(left: InTableAction<Row>, right: InTableAction<Row>): number => {
  const delta = actionPriority(left) - actionPriority(right);
  return delta !== 0 ? delta : 0;
};

const byPriorityDesc = <Row>(left: InTableAction<Row>, right: InTableAction<Row>): number => {
  return -byPriorityAsc(left, right);
};

export const rankTableActions = <Row>(
  actions: Array<InTableAction<Row>>,
  variant: "row" | "toolbar",
  allowedPermissions: string[] = [],
): RankedTableActions<Row> => {
  const visible = actions.filter((action) => isVisibleAction(action, allowedPermissions));

  if (variant === "row") {
    const detail = visible.find((action) => action.kind === "detail");
    const quick = visible.find((action) => action.kind === "quick");
    const inline = [detail, quick].filter((action): action is InTableAction<Row> => Boolean(action));
    const menu = visible.filter((action) => action !== detail && action !== quick);
    return { inline, menu, showMore: menu.length > 0 };
  }

  const never = visible
    .filter((action) => resolveActionOverflow(action) === "never")
    .sort(byPriorityAsc);
  const always = visible
    .filter((action) => resolveActionOverflow(action) === "always")
    .sort(byPriorityDesc);
  const auto = visible.filter((action) => resolveActionOverflow(action) === "auto");
  return {
    inline: [...auto.sort(byPriorityAsc), ...never],
    menu: always,
    showMore: always.length > 0,
  };
};

export interface OverflowGroup<Row = unknown> {
  id: string;
  actions: Array<InTableAction<Row>>;
  minPriority: number;
}

export const collectAutoGroups = <Row>(
  actions: Array<InTableAction<Row>>,
): Array<OverflowGroup<Row>> => {
  const groups = new Map<string, OverflowGroup<Row>>();
  const auto = actions.filter((action) => resolveActionOverflow(action) === "auto");
  auto.forEach((action, index) => {
    const id = action.overflowGroup ?? `__solo_${action.key}_${index}`;
    const current = groups.get(id);
    if (current) {
      current.actions.push(action);
      current.minPriority = Math.min(current.minPriority, actionPriority(action));
      return;
    }
    groups.set(id, {
      id,
      actions: [action],
      minPriority: actionPriority(action),
    });
  });
  return [...groups.values()].sort((left, right) => left.minPriority - right.minPriority);
};

const sectionWidth = (widths: number[], gap: number): number => {
  if (widths.length === 0) {
    return 0;
  }
  return widths.reduce((sum, width) => sum + width, 0) + gap * (widths.length - 1);
};

const joinSections = (sections: number[], gap: number): number => {
  const present = sections.filter((width) => width > 0);
  return sectionWidth(present, gap);
};

export const layoutToolbarOverflow = <Row>(
  available: number,
  actions: Array<InTableAction<Row>>,
  widths: Record<string, number>,
  options?: { gap?: number; moreWidth?: number },
): RankedTableActions<Row> => {
  const gap = options?.gap ?? TOOLBAR_GAP;
  const moreWidth = options?.moreWidth ?? MORE_BUTTON_WIDTH;
  const never = actions
    .filter((action) => resolveActionOverflow(action) === "never")
    .sort(byPriorityAsc);
  const always = actions
    .filter((action) => resolveActionOverflow(action) === "always")
    .sort(byPriorityDesc);
  const groups = collectAutoGroups(actions);

  const widthOf = (list: Array<InTableAction<Row>>): number =>
    sectionWidth(
      list.map((action) => widths[action.key] ?? 0),
      gap,
    );

  let visibleGroups = [...groups];
  const collapsedGroups: Array<OverflowGroup<Row>> = [];

  const measure = (): number => {
    const autoActions = visibleGroups.flatMap((group) => group.actions);
    const more = collapsedGroups.length > 0 || always.length > 0;
    return joinSections(
      [widthOf(autoActions), more ? moreWidth : 0, widthOf(never)],
      gap,
    );
  };

  while (visibleGroups.length > 0 && measure() > available) {
    const [next, ...rest] = visibleGroups;
    if (!next) {
      break;
    }
    collapsedGroups.push(next);
    visibleGroups = rest;
  }

  const inlineAuto = visibleGroups.flatMap((group) => [...group.actions].sort(byPriorityAsc));
  const menu = [
    ...collapsedGroups.flatMap((group) => [...group.actions].sort(byPriorityDesc)),
    ...always,
  ];

  return {
    inline: [...inlineAuto, ...never],
    menu,
    showMore: menu.length > 0,
  };
};

export const sameActionKeys = <Row>(
  left: Array<InTableAction<Row>>,
  right: Array<InTableAction<Row>>,
): boolean => {
  if (left.length !== right.length) {
    return false;
  }
  return left.every((action, index) => action.key === right[index]?.key);
};

export const resolveActionConfirm = (
  confirm: InTableAction<unknown>["confirm"],
): { title: string; message: string } | undefined => {
  if (!confirm) {
    return undefined;
  }
  if (typeof confirm === "string") {
    return { title: "提示", message: confirm };
  }
  return { title: confirm.title, message: confirm.description ?? confirm.title };
};
