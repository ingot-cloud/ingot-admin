import { describe, expect, it, vi } from "vitest";
import {
  createDelegationRowActions,
  delegationValidity,
  emptyDelegationRow,
} from "./table";

describe("平台授权管理员列表", () => {
  it("只保留详情和撤销，有效期把空时间显示为立即生效和长期有效", () => {
    const actions = createDelegationRowActions(emptyDelegationRow, {
      onDetail: vi.fn(),
      onDelete: vi.fn(),
    });
    expect(actions.map((item) => item.label)).toEqual(["详情", "撤销"]);
    expect(delegationValidity(emptyDelegationRow)).toBe("立即生效 至 长期有效");
  });
});
