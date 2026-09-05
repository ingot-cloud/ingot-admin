import { describe, expect, it } from "vitest";
import type { InTableAction } from "../types";
import {
  filterActionsByContext,
  layoutToolbarOverflow,
  rankTableActions,
  resolveActionConfirm,
} from "./actionRanking";

const noop = () => undefined;

const actions: Array<InTableAction<{ id: string }>> = [
  { key: "detail", label: "详情", kind: "detail", onSelect: noop },
  { key: "edit", label: "编辑", kind: "quick", onSelect: noop },
  { key: "enable", label: "启用", kind: "default", onSelect: noop },
  { key: "delete", label: "删除", kind: "danger", confirm: "确认删除该成员？", onSelect: noop },
  { key: "secret", label: "授权", kind: "default", permission: "member:grant", onSelect: noop },
];

const memberActions: Array<InTableAction<{ selected: string[] }>> = [
  {
    key: "leave",
    label: "批量操作离职",
    kind: "danger",
    overflow: "auto",
    overflowGroup: "batch",
    priority: 10,
    onSelect: noop,
  },
  {
    key: "dept",
    label: "批量变更部门",
    kind: "default",
    overflow: "auto",
    overflowGroup: "batch",
    priority: 20,
    onSelect: noop,
  },
  {
    key: "import",
    label: "批量导入/导出",
    kind: "default",
    overflow: "auto",
    overflowGroup: "batch",
    priority: 30,
    onSelect: noop,
  },
  {
    key: "invite",
    label: "邀请成员",
    kind: "default",
    overflow: "never",
    priority: 40,
    onSelect: noop,
  },
  {
    key: "add",
    label: "添加成员",
    kind: "quick",
    overflow: "never",
    priority: 50,
    onSelect: noop,
  },
];

const memberWidths = {
  leave: 108,
  dept: 108,
  import: 112,
  invite: 98,
  add: 98,
};

describe("rankTableActions", () => {
  it("行内最多展示详情和一个高频动作，其余进入菜单", () => {
    const ranked = rankTableActions(actions, "row");
    expect(ranked.inline.map((item) => item.key)).toEqual(["detail", "edit"]);
    expect(ranked.menu.map((item) => item.key)).toEqual(["enable", "delete"]);
  });

  it("无权限动作不渲染", () => {
    const ranked = rankTableActions(actions, "row", ["member:grant"]);
    expect(ranked.menu.map((item) => item.key)).toContain("secret");
    const hidden = rankTableActions(actions, "row", []);
    expect(hidden.menu.map((item) => item.key)).not.toContain("secret");
  });

  it("解析危险确认文案", () => {
    expect(resolveActionConfirm("确认删除该成员？")).toEqual({
      title: "提示",
      message: "确认删除该成员？",
    });
    expect(resolveActionConfirm({ title: "删除成员", description: "将无法恢复" })).toEqual({
      title: "删除成员",
      message: "将无法恢复",
    });
  });

  it("工具栏不再按选择数隐藏批量组", () => {
    const batch: Array<InTableAction<{ id: string }>> = [
      { key: "create", label: "新建", kind: "quick", overflow: "never", onSelect: noop },
      {
        key: "disable",
        label: "批量停用",
        kind: "danger",
        group: "batch",
        overflowGroup: "batch",
        disabled: true,
        disabledReason: "请先选择数据",
        onSelect: noop,
      },
    ];
    expect(
      filterActionsByContext(batch, { variant: "toolbar", selectedCount: 0 }).map((item) => item.key),
    ).toEqual(["create", "disable"]);
  });
});

describe("layoutToolbarOverflow", () => {
  const keysOf = (available: number) => {
    const result = layoutToolbarOverflow(available, memberActions, memberWidths);
    return {
      inline: result.inline.map((item) => item.key),
      menu: result.menu.map((item) => item.key),
      showMore: result.showMore,
    };
  };

  it("宽容器整组直出，不出现部分展开中间态", () => {
    for (const width of [1200, 940, 700]) {
      const result = keysOf(width);
      expect(result.inline, String(width)).toEqual(["leave", "dept", "import", "invite", "add"]);
      expect(result.menu, String(width)).toEqual([]);
      expect(result.showMore, String(width)).toBe(false);
    }
  });

  it("窄容器整组进入更多菜单，邀请和添加始终直出", () => {
    for (const width of [520, 360]) {
      const result = keysOf(width);
      expect(result.inline, String(width)).toEqual(["invite", "add"]);
      expect(result.menu, String(width)).toEqual(["import", "dept", "leave"]);
      expect(result.showMore, String(width)).toBe(true);
    }
  });
});
