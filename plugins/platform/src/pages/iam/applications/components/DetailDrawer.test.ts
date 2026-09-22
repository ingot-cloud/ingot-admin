import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "DetailDrawer.vue"),
  "utf8",
);

describe("platform iam application DetailDrawer", () => {
  it("保存成功后关闭详情抽屉", () => {
    const saveBlock = source.slice(
      source.indexOf("PlatformApplicationUpdateAPI"),
      source.indexOf("const requireAppId"),
    );
    expect(saveBlock).toContain("session.exitEdit()");
    expect(saveBlock).toContain("visible.value = false");
    expect(saveBlock.indexOf("session.exitEdit()")).toBeLessThan(
      saveBlock.indexOf("visible.value = false"),
    );
  });

  it("应用、资源和操作编码用可复制标签展示", () => {
    expect(source).toContain('<in-copy-tag :text="detail.record.code" />');
    expect(source).toContain('<in-copy-tag :text="asResource(row).record.code" />');
    expect(source).toContain('<in-copy-tag :text="asAction(row).record.code" />');
  });
});
