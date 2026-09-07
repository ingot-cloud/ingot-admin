import { describe, expect, it } from "vitest";
import { createMenuRowActions, MENU_TABLE_ID, tableHeaders } from "./table";

describe("platform config menu table contract", () => {
  it("提供稳定 tableId，名称列为必选", () => {
    expect(MENU_TABLE_ID).toBe("platform-config-menu");
    expect(tableHeaders.find((item) => item.prop === "name")?.required).toBe(true);
  });

  it("行内只展示编辑，200 行映射保持稳定", () => {
    const rows = Array.from({ length: 200 }, (_, index) => ({
      id: String(index + 1),
      name: `菜单-${index + 1}`,
    }));
    const actions = createMenuRowActions(rows[0]!, {
      onEdit: () => undefined,
    });
    expect(actions.map((item) => `${item.kind}:${item.key}`)).toEqual(["detail:edit"]);
    expect(rows).toHaveLength(200);
    expect(
      createMenuRowActions(rows[199]!, { onEdit: () => undefined }).map((item) => item.key),
    ).toEqual(["edit"]);
  });
});
