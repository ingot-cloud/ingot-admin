import { describe, expect, it } from "vitest";
import {
  createEndpointGroupRowActions,
  createEndpointGroupToolbarActions,
  ENDPOINT_GROUP_TABLE_ID,
  endpointGroupTableHeaders,
} from "./endpointGroupTable";

describe("security access endpoint group table contract", () => {
  it("提供稳定 tableId", () => {
    expect(ENDPOINT_GROUP_TABLE_ID).toBe("security-access-endpoint-group");
    expect(endpointGroupTableHeaders.some((item) => item.prop === "actions")).toBe(true);
  });

  it("工具栏新建分组始终直出，行内编辑为详情", () => {
    const toolbar = createEndpointGroupToolbarActions(() => undefined);
    expect(toolbar).toEqual([
      expect.objectContaining({
        key: "create",
        label: "新建分组",
        kind: "quick",
        icon: "ep:plus",
        overflow: "never",
      }),
    ]);
    const rows = createEndpointGroupRowActions(
      { id: 1, name: "分组" },
      { onDetail: () => undefined },
    );
    expect(rows.map((item) => `${item.kind}:${item.key}`)).toEqual(["detail:detail"]);
    expect(rows[0]?.label).toBe("编辑");
  });
});
