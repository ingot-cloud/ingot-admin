import { describe, expect, it } from "vitest";
import { isCatalogImageIcon } from "./catalogIcon";

describe("isCatalogImageIcon", () => {
  it("把 Iconify 与设计系统名当成矢量图标", () => {
    expect(isCatalogImageIcon("ep:menu")).toBe(false);
    expect(isCatalogImageIcon("ingot:bell-outlined")).toBe(false);
    expect(isCatalogImageIcon("")).toBe(false);
    expect(isCatalogImageIcon()).toBe(false);
  });

  it("把时效链接和对象路径当成 Logo 图", () => {
    expect(isCatalogImageIcon("https://minio.local/ingot/app/icon/a.png")).toBe(true);
    expect(isCatalogImageIcon("ingot/app/icon/a.png")).toBe(true);
  });
});
