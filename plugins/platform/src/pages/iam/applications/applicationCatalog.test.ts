import { describe, expect, it, vi } from "vitest";

vi.mock("@/api/iam/catalog", () => ({
  PlatformActionCatalogAPI: vi.fn(),
  PlatformMenuActionsAPI: vi.fn(),
}));

import { menuActionsFromRecords } from "./applicationCatalog";

describe("application catalog adapters", () => {
  it("菜单关联操作带上资源名", () => {
    const actions = menuActionsFromRecords(
      [
        {
          id: "11",
          code: "demo:member:read",
          name: "查看成员",
          resourceId: "21",
          resourceCode: "member",
          resourceName: "成员",
        },
      ],
      "1",
      "演示",
    );
    expect(actions[0]).toMatchObject({
      resourceName: "成员",
      applicationName: "演示",
      code: "demo:member:read",
    });
  });
});
