import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import { SESSION_POLICY_UPDATE_PERMISSION } from "./constants";

vi.mock("@/models/enums/sessionEnums", () => ({
  SessionConcurrencyScopeEnum: { GLOBAL: "GLOBAL", CLIENT: "CLIENT", USER_TYPE: "USER_TYPE" },
}));

import {
  createConcurrencyPolicyRowActions,
  createConcurrencyPolicyToolbarActions,
  policyTableHeaders,
  SESSIONS_POLICY_TABLE_ID,
} from "./policyTable";

const panelSource = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "components/ConcurrencyPolicyPanel.vue"),
  "utf8",
);

describe("security sessions policy table contract", () => {
  it("提供稳定 tableId，面板无 @refresh", () => {
    expect(SESSIONS_POLICY_TABLE_ID).toBe("security-sessions-policy");
    expect(policyTableHeaders.some((item) => item.prop === "actions")).toBe(true);
    expect(panelSource).toContain("SESSIONS_POLICY_TABLE_ID");
    expect(panelSource).toContain('density="compact"');
    expect(panelSource).not.toContain("@refresh");
    expect(panelSource).not.toContain("#toolbar");
  });

  it("工具栏新建策略始终直出并带更新权限", () => {
    const actions = createConcurrencyPolicyToolbarActions(() => undefined);
    expect(actions).toEqual([
      expect.objectContaining({
        key: "create",
        label: "新建策略",
        kind: "quick",
        icon: "ep:plus",
        overflow: "never",
        permission: SESSION_POLICY_UPDATE_PERMISSION,
      }),
    ]);
  });

  it("GLOBAL 范围不可删除，确认留给 useOps", () => {
    const globalActions = createConcurrencyPolicyRowActions(
      { id: 1, scope: "GLOBAL" },
      {
        onDetail: () => undefined,
        onDelete: () => undefined,
      },
    );
    expect(globalActions.map((item) => `${item.kind}:${item.key}`)).toEqual([
      "detail:detail",
      "danger:delete",
    ]);
    expect(globalActions[0]?.permission).toBe(SESSION_POLICY_UPDATE_PERMISSION);
    expect(globalActions[1]?.disabled).toBe(true);
    expect(globalActions[1]?.disabledReason).toBe(
      "全局兜底策略不可删除，可将最大会话数改为 0 以关闭限制",
    );
    expect(globalActions[1]?.confirm).toBeUndefined();

    const clientActions = createConcurrencyPolicyRowActions(
      { id: 2, scope: "CLIENT" },
      {
        onDetail: () => undefined,
        onDelete: () => undefined,
      },
    );
    expect(clientActions[1]?.disabled).toBe(false);
    expect(clientActions[1]?.confirm).toBeUndefined();
  });
});
