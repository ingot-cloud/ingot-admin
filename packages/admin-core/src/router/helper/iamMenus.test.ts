import { describe, expect, it } from "vitest";
import { mapIamMenus } from "./iamMenus";

describe("mapIamMenus", () => {
  it("把 DIRECTORY/PAGE 映射为既有菜单类型并递归子节点", () => {
    const menus = mapIamMenus([
      {
        id: "dir-1",
        applicationId: "app-1",
        name: "组织与租户",
        kind: "DIRECTORY",
        sortOrder: 1,
        children: [
          {
            id: "page-1",
            applicationId: "app-1",
            name: "租户",
            kind: "PAGE",
            path: "/platform/tenants",
            viewPath: "platform.iam.tenants",
            sortOrder: 1,
            children: [],
          },
        ],
      },
    ]);
    expect(menus).toHaveLength(1);
    expect(menus[0]?.menuType).toBe("0");
    expect(menus[0]?.children?.[0]?.menuType).toBe("1");
    expect(menus[0]?.children?.[0]?.viewPath).toBe("platform.iam.tenants");
  });
});
