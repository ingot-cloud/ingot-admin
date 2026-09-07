import { describe, expect, it } from "vitest";
import {
  CLIENT_TABLE_ID,
  createClientRowActions,
  createClientToolbarActions,
  tableHeaders,
} from "./table";

describe("platform develop client table contract", () => {
  it("提供稳定 tableId，clientName 列为必选", () => {
    expect(CLIENT_TABLE_ID).toBe("platform-develop-client");
    expect(tableHeaders.find((item) => item.prop === "clientName")?.required).toBe(true);
  });

  it("工具栏添加客户端始终直出", () => {
    const actions = createClientToolbarActions(() => undefined);
    expect(actions.map((item) => `${item.kind}:${item.key}`)).toEqual(["quick:create"]);
    expect(actions[0]?.overflow).toBe("never");
    expect(actions[0]?.icon).toBe("ep:plus");
  });

  it("行内只展示详情，200 行映射保持稳定", () => {
    const rows = Array.from({ length: 200 }, (_, index) => ({
      id: String(index + 1),
      clientName: `客户端-${index + 1}`,
    }));
    const actions = createClientRowActions(rows[0]!, {
      onDetail: () => undefined,
    });
    expect(actions.map((item) => `${item.kind}:${item.key}`)).toEqual(["detail:detail"]);
    expect(rows).toHaveLength(200);
    expect(
      createClientRowActions(rows[199]!, { onDetail: () => undefined }).map((item) => item.key),
    ).toEqual(["detail"]);
  });
});
