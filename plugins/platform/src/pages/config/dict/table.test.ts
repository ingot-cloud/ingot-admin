import { describe, expect, it, vi } from "vitest";
import {
  createDictItemRowActions,
  createDictToolbarActions,
  DICT_SPLIT_KEY,
  DICT_TABLE_ID,
  tableHeaders,
} from "./table";

vi.mock("@/models/enums", () => ({
  CommonStatus: { Enable: "0", Lock: "9" },
}));

const Enable = "0";
const Lock = "9";

const handlers = {
  onDetail: () => undefined,
  onToggleStatus: () => undefined,
  onDelete: () => undefined,
};

describe("platform config dict table contract", () => {
  it("提供稳定 tableId，名称列为必选", () => {
    expect(DICT_TABLE_ID).toBe("platform-config-dict");
    expect(DICT_SPLIT_KEY).toBe("platform-config-dict");
    expect(tableHeaders.find((item) => item.prop === "name")?.required).toBe(true);
    expect(tableHeaders.some((item) => item.prop === "actions")).toBe(true);
  });

  it("工具栏新建类型描边、新建项实心，均直出", () => {
    const enabled = createDictToolbarActions({
      onCreateType: () => undefined,
      onCreateItem: () => undefined,
    });
    expect(enabled).toEqual([
      expect.objectContaining({
        key: "create-type",
        label: "新建字典类型",
        kind: "primary",
        icon: "ep:plus",
        overflow: "never",
        disabled: false,
      }),
      expect.objectContaining({
        key: "create-item",
        label: "新建字典项",
        kind: "quick",
        icon: "ep:plus",
        overflow: "never",
        disabled: false,
      }),
    ]);

    const disabled = createDictToolbarActions(
      { onCreateType: () => undefined, onCreateItem: () => undefined },
      {
        typeDisabled: true,
        typeDisabledReason: "请先选择租户",
        itemDisabled: true,
      },
    );
    expect(disabled[0]?.disabled).toBe(true);
    expect(disabled[0]?.disabledReason).toBe("请先选择租户");
    expect(disabled[1]?.disabled).toBe(true);
    expect(disabled[1]?.disabledReason).toBe("请先选择字典类型");
  });

  it("行内展示编辑、启停和删除，200 行映射保持稳定", () => {
    const rows = Array.from({ length: 200 }, (_, index) => ({
      id: String(index + 1),
      name: `字典-${index + 1}`,
      label: `项-${index + 1}`,
      status: index % 2 === 0 ? Enable : Lock,
      systemFlag: index % 5 === 0,
    }));
    const sample = createDictItemRowActions(rows[0]!, handlers);
    expect(sample.map((item) => `${item.kind}:${item.key}`)).toEqual([
      "detail:detail",
      "default:toggle-status",
      "danger:delete",
    ]);
    expect(sample[0]?.kind).toBe("detail");
    expect(sample[1]?.label).toBe("禁用");
    expect(sample[1]?.confirm).toBe("是否禁用字典(项-1)");
    expect(sample[2]?.disabled).toBe(true);
    expect(sample[2]?.disabledReason).toBe("内置字典不允许该操作");
    expect(rows).toHaveLength(200);
    expect(createDictItemRowActions(rows[1]!, handlers)[1]?.label).toBe("启用");
    expect(createDictItemRowActions(rows[1]!, handlers)[1]?.confirm).toBe("是否启用字典(项-2)");
    expect(createDictItemRowActions(rows[1]!, handlers)[2]?.disabled).toBe(false);
  });
});
