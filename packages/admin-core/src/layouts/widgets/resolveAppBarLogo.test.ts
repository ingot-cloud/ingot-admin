import { describe, expect, it } from "vitest";
import { resolveAppBarLogo } from "./resolveAppBarLogo";

describe("resolveAppBarLogo", () => {
  it("默认使用 framed 资源，并按 dark 切换", () => {
    const light = resolveAppBarLogo(undefined, false);
    const dark = resolveAppBarLogo(undefined, true);
    expect(light).not.toBe(dark);
    expect(String(light)).toMatch(/F6F3EA|in-light-framed/);
    expect(String(dark)).toMatch(/12161D|in-dark-framed/);
  });

  it("自定义 branding.logo 优先于默认 framed 资源", () => {
    expect(resolveAppBarLogo("/custom.svg", true)).toBe("/custom.svg");
    expect(resolveAppBarLogo("/custom.svg", false)).toBe("/custom.svg");
  });
});
