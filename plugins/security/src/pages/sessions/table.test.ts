import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { SESSION_REVOKE_PERMISSION } from "./constants";
import { createSessionRowActions, SESSIONS_TABLE_ID, tableHeaders } from "./table";

const panelSource = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "components/SessionListPanel.vue"),
  "utf8",
);

describe("security sessions table contract", () => {
  it("提供稳定 tableId，面板无 @refresh", () => {
    expect(SESSIONS_TABLE_ID).toBe("security-sessions");
    expect(tableHeaders.some((item) => item.prop === "actions")).toBe(true);
    expect(panelSource).toContain("SESSIONS_TABLE_ID");
    expect(panelSource).toContain('density="compact"');
    expect(panelSource).toContain("in-avatar");
    expect(panelSource).toContain("displaySessionUser");
    expect(panelSource).not.toContain("@refresh");
    expect(panelSource).not.toContain("#toolbar");
  });

  it("行内展示详情与下线，确认留给 useOps", () => {
    const actions = createSessionRowActions(
      { sid: "sid-1", userId: "1", nickname: "用户1" },
      {
        onDetail: () => undefined,
        onRevokeSid: () => undefined,
        onRevokeUser: () => undefined,
      },
    );
    expect(actions.map((item) => `${item.kind}:${item.key}`)).toEqual([
      "detail:detail",
      "danger:revoke-sid",
      "danger:revoke-user",
    ]);
    expect(actions[1]?.permission).toBe(SESSION_REVOKE_PERMISSION);
    expect(actions[2]?.permission).toBe(SESSION_REVOKE_PERMISSION);
    expect(actions[1]?.confirm).toBeUndefined();
    expect(actions[2]?.confirm).toBeUndefined();
  });
});
