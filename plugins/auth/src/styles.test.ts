import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const srcDir = dirname(fileURLToPath(import.meta.url));

describe("auth plugin styles", () => {
  it("入口静态拉取登录布局与 Element Plus 组件样式", () => {
    const plugin = readFileSync(resolve(srcDir, "plugin.ts"), "utf8");
    const styles = readFileSync(resolve(srcDir, "styles.ts"), "utf8");
    expect(plugin).toContain('import "./styles"');
    expect(styles).toContain("element-plus/theme-chalk/el-button.css");
    expect(styles).toContain("element-plus/theme-chalk/el-input.css");
    expect(styles).toContain("element-plus/theme-chalk/el-image.css");
    expect(styles).toContain("./pages/challenge/login.css");
  });
});
