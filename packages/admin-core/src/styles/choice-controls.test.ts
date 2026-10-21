import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const stylesDir = dirname(fileURLToPath(import.meta.url));

describe("choice controls", () => {
  const choice = readFileSync(resolve(stylesDir, "choice.css"), "utf8");
  const tree = readFileSync(resolve(stylesDir, "tree.css"), "utf8");
  const entry = readFileSync(resolve(stylesDir, "index.ts"), "utf8");

  it("接入全局勾选与树样式", () => {
    expect(entry).toContain("./choice.css");
    expect(entry).toContain("./tree.css");
  });

  it("多选使用框架尺寸、勾和半选图形", () => {
    expect(choice).toContain("--el-checkbox-input-width: var(--in-checkbox-size)");
    expect(choice).toContain("--el-checkbox-border-radius: var(--in-checkbox-radius)");
    expect(choice).toContain("--el-checkbox-bg-color: var(--in-white)");
    expect(choice).toContain("--el-checkbox-checked-bg-color: var(--in-color-primary)");
    expect(choice).toContain("border: 1px solid var(--in-gray-500)");
    expect(choice).toContain("var(--in-choice-border)");
    expect(choice).toContain("checkbox-checked.svg");
    expect(choice).toContain("checkbox-indeterminate.svg");
    expect(choice).toContain("var(--in-choice-disabled-bg)");
    expect(choice).toContain("var(--in-choice-disabled-border)");
    expect(choice).toContain("opacity: 1");
    expect(choice).not.toContain("opacity: 0.5");
    expect(choice).not.toContain("scale(");
  });

  it("单选是圆，选中为主题色边框加圆心", () => {
    expect(choice).toContain("--el-radio-input-width: var(--in-radio-size)");
    expect(choice).toContain("border-radius: 50%");
    expect(choice).toContain("background-color: transparent");
    expect(choice).toContain("border-color: var(--in-color-primary)");
    expect(choice).toContain("width: calc(var(--in-radio-size) / 2)");
    expect(choice).toContain(".el-checkbox.is-disabled");
    expect(choice).toContain(".el-radio.is-disabled");
    expect(choice).toContain("border: 1px solid var(--in-choice-border)");
  });

  it("树箭头吃次要文字色，收起朝右、展开朝下", () => {
    expect(tree).toContain("var(--in-tree-caret-size)");
    expect(tree).toContain("var(--in-text-color-secondary)");
    expect(tree).toContain("tree-caret.svg");
    expect(tree).toContain("transform: rotate(-90deg)");
    expect(tree).toContain("transform: none !important");
    expect(tree).toContain(".is-leaf::before");
    expect(tree).not.toContain("#646a73");
    expect(tree).not.toContain("el-table__expand-icon");
  });
});
