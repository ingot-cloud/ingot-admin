import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const dir = dirname(fileURLToPath(import.meta.url));
const pickerSource = readFileSync(resolve(dir, "BizIamMemberPickerDialog.vue"), "utf8");
const wizardSource = readFileSync(resolve(dir, "BizIamGroupWizard.vue"), "utf8");

describe("iam member picker bound list", () => {
  it("已绑定列走独立分页并可加载更多", () => {
    expect(pickerSource).toContain("loadBound");
    expect(pickerSource).toContain("加载更多");
    expect(pickerSource).toContain("privateLoadMoreBound");
    expect(wizardSource).toContain("loadBound");
    expect(wizardSource).not.toContain("loadSelected");
  });
});
