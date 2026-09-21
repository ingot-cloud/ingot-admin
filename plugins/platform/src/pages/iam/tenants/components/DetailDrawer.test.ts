import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const dir = dirname(fileURLToPath(import.meta.url));
const drawerSource = readFileSync(resolve(dir, "DetailDrawer.vue"), "utf8");
const apiSource = readFileSync(resolve(dir, "../../../../api/iam/tenants.ts"), "utf8");

describe("platform iam tenant detail entitlements", () => {
  it("开通列表按分页信封收齐，不把 data 当数组 map", () => {
    expect(apiSource).toContain("IamPageResponse<ResourceDetail<EntitlementRecord>>");
    expect(apiSource).toContain("toIamListParams(page)");
    expect(drawerSource).toContain("collectIamPageRecords");
    expect(drawerSource).toContain("entitlementCollectionVersion");
    expect(drawerSource).not.toContain("entitlementRes.data ?? []");
  });

  it("所有者 Tab 不可编辑，基础信息走查看/编辑表单", () => {
    expect(drawerSource).toContain(':editable="false"');
    expect(drawerSource).toContain("<in-form");
    expect(drawerSource).toContain("in-detail-field");
    expect(drawerSource).toContain(':editing="editing"');
    expect(drawerSource).toContain("createLoadGuard");
    expect(drawerSource).toContain("privateReset");
    expect(drawerSource).toContain("previewing");
  });
});
