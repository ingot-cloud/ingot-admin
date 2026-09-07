import { describe, expect, it } from "vitest";
import { createIdRowActions, createIdToolbarActions, ID_TABLE_ID, tableHeaders } from "./table";

describe("platform develop id table contract", () => {
  it("提供稳定 tableId，bizTag 列为必选", () => {
    expect(ID_TABLE_ID).toBe("platform-develop-id");
    expect(tableHeaders.find((item) => item.prop === "bizTag")?.required).toBe(true);
  });

  it("工具栏添加业务ID始终直出", () => {
    const actions = createIdToolbarActions(() => undefined);
    expect(actions.map((item) => `${item.kind}:${item.key}`)).toEqual(["quick:create"]);
    expect(actions[0]?.overflow).toBe("never");
    expect(actions[0]?.icon).toBe("ep:plus");
  });

  it("行内只展示编辑，200 行映射保持稳定", () => {
    const rows = Array.from({ length: 200 }, (_, index) => ({
      bizTag: `tag-${index + 1}`,
    }));
    const actions = createIdRowActions(rows[0]!, {
      onEdit: () => undefined,
    });
    expect(actions.map((item) => `${item.kind}:${item.key}`)).toEqual(["detail:edit"]);
    expect(rows).toHaveLength(200);
    expect(
      createIdRowActions(rows[199]!, { onEdit: () => undefined }).map((item) => item.key),
    ).toEqual(["edit"]);
  });
});
