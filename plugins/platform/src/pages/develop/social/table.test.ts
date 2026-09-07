import { describe, expect, it, vi } from "vitest";
import {
  createSocialRowActions,
  createSocialToolbarActions,
  SOCIAL_TABLE_ID,
  tableHeaders,
} from "./table";

vi.mock("@/models/enums", () => ({
  CommonStatus: { Enable: "0", Lock: "9" },
  getCommonStatusToggle: (status: string) => (status === "0" ? "9" : "0"),
  getCommonStatusActionDesc: (status: string) => (status === "0" ? "启用" : "锁定"),
  useSocialTypeEnumsEnum: () => ({
    getTagText: (value: string) => ({ text: value }),
  }),
}));

const Enable = "0";
const Lock = "9";

const handlers = {
  onEdit: () => undefined,
  onToggleStatus: () => undefined,
  onRemove: () => undefined,
};

describe("platform develop social table contract", () => {
  it("提供稳定 tableId，名称列为必选", () => {
    expect(SOCIAL_TABLE_ID).toBe("platform-develop-social");
    expect(tableHeaders.find((item) => item.prop === "name")?.required).toBe(true);
  });

  it("工具栏添加配置始终直出", () => {
    const actions = createSocialToolbarActions(() => undefined);
    expect(actions.map((item) => `${item.kind}:${item.key}`)).toEqual(["quick:create"]);
    expect(actions[0]?.overflow).toBe("never");
    expect(actions[0]?.icon).toBe("ep:plus");
  });

  it("行内展示编辑，启停和删除进入更多且 200 行映射稳定", () => {
    const rows = Array.from({ length: 200 }, (_, index) => ({
      id: String(index + 1),
      name: `社交-${index + 1}`,
      status: index % 2 === 0 ? Enable : Lock,
    }));
    const actions = createSocialRowActions(rows[0]!, handlers);
    expect(actions.map((item) => `${item.kind}:${item.key}`)).toEqual([
      "detail:edit",
      "default:toggle-status",
      "danger:remove",
    ]);
    expect(actions[1]?.label).toBe("锁定");
    expect(actions[1]?.confirm).toBe("是否锁定社交信息(社交-1)");
    expect(actions[2]?.confirm).toBe("是否删除社交信息(社交-1)");
    expect(rows).toHaveLength(200);
    expect(createSocialRowActions(rows[1]!, handlers)[1]?.label).toBe("启用");
  });
});
