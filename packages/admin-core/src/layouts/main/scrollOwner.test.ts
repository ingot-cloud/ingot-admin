import { describe, expect, it } from "vitest";
import { resolveScrollOwner } from "./scrollOwner";

describe("resolveScrollOwner", () => {
  it("优先使用 page 模式正文，其次表格数据区", () => {
    const root = document.createElement("div");
    root.innerHTML = `
      <div class="in-page-frame__body is-contained"></div>
      <div class="in-table__body"></div>
    `;
    expect(resolveScrollOwner(root)?.className).toContain("in-table__body");

    root.innerHTML = `<div class="in-page-frame__body is-page"></div>`;
    expect(resolveScrollOwner(root)?.className).toContain("is-page");
  });
});
