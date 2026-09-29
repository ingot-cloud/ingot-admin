import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const dir = dirname(fileURLToPath(import.meta.url));
const workspaceSource = readFileSync(resolve(dir, "GroupWorkspace.vue"), "utf8");
const wizardSource = readFileSync(resolve(dir, "GroupWizard.vue"), "utf8");
const optionsSource = readFileSync(resolve(dir, "../iamMemberOptions.ts"), "utf8");

describe("platform group member picker", () => {
  it("工作区添加成员右侧走组成员接口而不是 ids", () => {
    expect(workspaceSource).toContain("loadPlatformGroupBoundMembers");
    expect(workspaceSource).toContain("boundIds");
    expect(workspaceSource).not.toContain("loadPlatformMembersByIds");
    expect(optionsSource).toContain("PlatformGroupMembersAPI");
    expect(optionsSource).not.toContain("ids: ids.join");
  });

  it("向导编辑已绑定成员也走组成员分页", () => {
    expect(wizardSource).toContain("loadBoundMembers");
    expect(wizardSource).not.toContain("load-selected");
    expect(wizardSource).not.toContain("loadPlatformMembersByIds");
  });
});
