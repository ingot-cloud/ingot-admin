import { describe, expect, it } from "vitest";
import { createPermissionRowActions, PERMISSION_TABLE_ID, tableHeaders } from "./table";

describe("platform config permission table contract", () => {
  it("提供稳定 tableId，code 列为必选", () => {
    expect(PERMISSION_TABLE_ID).toBe("platform-config-permission");
    expect(tableHeaders.find((item) => item.prop === "code")?.required).toBe(true);
    expect(tableHeaders.find((item) => item.prop === "nodeType")?.label).toBe("节点类型");
    expect(tableHeaders.some((item) => item.prop === "type")).toBe(false);
  });

  it("行内只展示编辑，200 行映射保持稳定", () => {
    const rows = Array.from({ length: 200 }, (_, index) => ({
      id: String(index + 1),
      code: `perm-${index + 1}`,
    }));
    const actions = createPermissionRowActions(rows[0]!, {
      onEdit: () => undefined,
    });
    expect(actions.map((item) => `${item.kind}:${item.key}`)).toEqual(["detail:edit"]);
    expect(rows).toHaveLength(200);
    expect(
      createPermissionRowActions(rows[199]!, { onEdit: () => undefined }).map((item) => item.key),
    ).toEqual(["edit"]);
  });
});
