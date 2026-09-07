import { describe, expect, it } from "vitest";
import {
  createOrgAuthToolbarActions,
  ORG_AUTH_SPLIT_KEY,
  ORG_AUTH_TABLE_ID,
  tableHeaders,
} from "./table";

describe("org contacts auth table contract", () => {
  it("提供稳定 tableId 与双栏持久化键", () => {
    expect(ORG_AUTH_TABLE_ID).toBe("org-contacts-auth");
    expect(ORG_AUTH_SPLIT_KEY).toBe("org-contacts-auth");
    expect(tableHeaders.find((item) => item.prop === "code")?.required).toBe(true);
    expect(tableHeaders.some((item) => item.prop === "actions")).toBe(false);
  });

  it("仅在可编辑时提供编辑权限工具栏", () => {
    const hidden = createOrgAuthToolbarActions(false, () => undefined);
    expect(hidden).toEqual([]);

    const actions = createOrgAuthToolbarActions(true, () => undefined);
    expect(actions.map((item) => `${item.kind}:${item.key}`)).toEqual(["quick:edit"]);
    expect(actions[0]?.overflow).toBe("never");
    expect(actions[0]?.label).toBe("编辑权限");
  });
});
