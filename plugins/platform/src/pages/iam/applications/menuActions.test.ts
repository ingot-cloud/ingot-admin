import { describe, expect, it } from "vitest";
import {
  actionsOfCatalog,
  buildActionCatalog,
  filterActionCatalog,
  groupMenuActions,
  type MenuActionOption,
} from "./menuActions";

const action = (
  id: string,
  name: string,
  code: string,
  resourceId: string,
  resourceName: string,
): MenuActionOption => ({
  id,
  name,
  code,
  resourceId,
  resourceName,
  applicationId: "app-1",
  applicationName: "平台治理",
});

describe("application menu action hierarchy", () => {
  it("按应用和资源分组，避免只看操作名", () => {
    const groups = groupMenuActions([
      action("a1", "查看", "iam-platform:role:read", "role", "角色授权"),
      action("a2", "查看", "iam-platform:app:read", "app", "应用可用人群"),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.applicationName).toBe("平台治理");
    expect(groups[0]?.resources.map((item) => item.resourceName)).toEqual(["角色授权", "应用可用人群"]);
    expect(groups[0]?.resources[0]?.actions[0]?.code).toBe("iam-platform:role:read");
  });

  it("搜索资源名时保留该资源全部操作", () => {
    const catalog = {
      applicationId: "app-1",
      applicationName: "平台治理",
      resources: [
        {
          id: "role",
          name: "角色授权",
          code: "role",
          actions: [action("a1", "查看", "iam-platform:role:read", "role", "角色授权")],
        },
        {
          id: "app",
          name: "应用可用人群",
          code: "audience",
          actions: [action("a2", "编辑", "iam-platform:app:write", "app", "应用可用人群")],
        },
      ],
    };
    const filtered = filterActionCatalog(catalog, "角色");
    expect(filtered.resources).toHaveLength(1);
    expect(filtered.resources[0]?.id).toBe("role");
  });

  it("一次资源列表加一次操作列表即可组树，已选从同一份过滤", () => {
    const catalog = buildActionCatalog({
      applicationId: "app-1",
      applicationName: "平台治理",
      resources: [
        { id: "role", name: "角色授权", code: "role" },
        { id: "app", name: "应用可用人群", code: "audience" },
      ],
      actions: [
        action("a1", "查看", "iam-platform:role:read", "role", "角色授权"),
        action("a2", "编辑", "iam-platform:app:write", "app", "应用可用人群"),
      ],
    });
    expect(catalog.resources).toHaveLength(2);
    expect(actionsOfCatalog(catalog, ["a2"]).map((item) => item.id)).toEqual(["a2"]);
  });
});
