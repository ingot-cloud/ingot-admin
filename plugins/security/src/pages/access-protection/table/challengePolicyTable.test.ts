import { describe, expect, it } from "vitest";
import {
  CHALLENGE_POLICY_TABLE_ID,
  challengePolicyTableHeaders,
  createChallengePolicyRowActions,
  createChallengePolicyToolbarActions,
} from "./challengePolicyTable";

describe("security access challenge policy table contract", () => {
  it("提供稳定 tableId", () => {
    expect(CHALLENGE_POLICY_TABLE_ID).toBe("security-access-challenge");
    expect(challengePolicyTableHeaders.some((item) => item.prop === "actions")).toBe(true);
  });

  it("工具栏新建挑战策略始终直出，行内编辑为详情", () => {
    const toolbar = createChallengePolicyToolbarActions(() => undefined);
    expect(toolbar).toEqual([
      expect.objectContaining({
        key: "create",
        label: "新建挑战策略",
        kind: "quick",
        icon: "ep:plus",
        overflow: "never",
      }),
    ]);
    const rows = createChallengePolicyRowActions(
      { id: "1", code: "ch-1" },
      { onDetail: () => undefined },
    );
    expect(rows.map((item) => `${item.kind}:${item.key}`)).toEqual(["detail:detail"]);
    expect(rows[0]?.label).toBe("编辑");
  });
});
