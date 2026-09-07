import { describe, expect, it } from "vitest";
import {
  createIpListRowActions,
  createIpListToolbarActions,
  IP_LIST_TABLE_ID,
  ipListTableHeaders,
} from "./ipListTable";

describe("security access ip list table contract", () => {
  it("提供稳定 tableId", () => {
    expect(IP_LIST_TABLE_ID).toBe("security-access-ip-list");
    expect(ipListTableHeaders.some((item) => item.prop === "actions")).toBe(true);
  });

  it("工具栏新建名单始终直出，行内编辑为详情", () => {
    const toolbar = createIpListToolbarActions(() => undefined);
    expect(toolbar).toEqual([
      expect.objectContaining({
        key: "create",
        label: "新建名单",
        kind: "quick",
        icon: "ep:plus",
        overflow: "never",
      }),
    ]);
    const rows = createIpListRowActions({ id: 1, keyValue: "1.1.1.1" }, { onDetail: () => undefined });
    expect(rows.map((item) => `${item.kind}:${item.key}`)).toEqual(["detail:detail"]);
    expect(rows[0]?.label).toBe("编辑");
  });
});
