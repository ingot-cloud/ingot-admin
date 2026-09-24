import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "CreateWizard.vue"), "utf8");

describe("platform iam application CreateWizard", () => {
  it("全屏分步创建，关闭在左侧", () => {
    expect(source).toContain('title="创建应用"');
    expect(source).toContain('size="100%"');
    expect(source).toContain('close-position="start"');
    expect(source).toContain("APP_WIZARD_STEPS");
    expect(source).toContain("application-icon-field");
    expect(source).toContain('v-model="profile.icon"');
    expect(source).toContain("catalog-draft-panel");
    expect(source).toContain(':profile="profile"');
    expect(source).toContain("menu-draft-panel");
    expect(source).toContain("app-preview-panel");
    expect(source).toContain("PlatformApplicationBundleCreateAPI");
    expect(source).toContain("toApplicationBundle");
    expect(source).not.toContain("PlatformApplicationCreateAPI");
    expect(source).not.toContain("PlatformResourceCreateAPI");
    expect(source).not.toContain("PlatformActionCreateAPI");
    expect(source).not.toContain("PlatformMenuCreateAPI");
  });
});
