import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { enableAutoUnmount, flushPromises, mount } from "@vue/test-utils";
import { h, nextTick } from "vue";
import { createPinia, setActivePinia } from "pinia";
import InTable from "./InTable.vue";
import type { TableAPI } from "./types";

enableAutoUnmount(afterEach);
beforeEach(() => setActivePinia(createPinia()));
const global = { stubs: { ElPagination: true } };
const settle = async () => {
  await nextTick();
  await flushPromises();
};

describe("InTable 真实 Element Plus 列渲染", () => {
  it("原生 selection 和 index 可见，保留逐条禁用、全选与选择事件", async () => {
    const rows = [
      { id: "1", name: "可绑定成员", canBind: true },
      { id: "2", name: "不可绑定成员", canBind: false },
    ];
    const wrapper = mount(InTable, {
      attachTo: document.body,
      props: {
        rowKey: "id",
        headers: [
          {
            type: "selection",
            prop: "selection",
            headerCheckbox: true,
            selectable: (row: (typeof rows)[number]) => row.canBind,
          },
          { type: "index", prop: "index", label: "序号" },
          { prop: "name", label: "名称" },
        ],
        data: rows,
      },
      global,
    });
    await settle();
    const checks = wrapper.findAll(".el-table__body input[type=checkbox]");
    expect(checks).toHaveLength(2);
    expect(checks[1].attributes("disabled")).toBeDefined();
    const firstCells = wrapper.findAll(".el-table__body tbody tr")[0].findAll("td");
    expect(firstCells[1].text()).toBe("1");
    expect(firstCells[2].text()).toBe("可绑定成员");
    await checks[0].setValue(true);
    expect(wrapper.emitted("selection-change")?.at(-1)).toEqual([[rows[0]]]);
    (wrapper.vm as unknown as TableAPI).clearSelection();
    await settle();
    await wrapper.get(".el-table__header input[type=checkbox]").setValue(true);
    await vi.waitFor(() =>
      expect(wrapper.emitted("selection-change")?.at(-1)).toEqual([[rows[0]]]),
    );
  });

  it("原生 selection 表头仍默认关闭，业务列只收到真实行", async () => {
    const wrapper = mount(InTable, {
      props: {
        headers: [
          { type: "selection", prop: "selection" },
          { prop: "name", label: "名称" },
        ],
        data: [{ record: { name: "组织A" } }],
      },
      slots: {
        name: ({ item }: { item: { record: { name: string } } }) =>
          h("span", { class: "business-name" }, item.record.name),
      },
      global,
    });
    await settle();
    expect(wrapper.classes()).toContain("is-hide-header-selection");
    expect(wrapper.get(".business-name").text()).toBe("组织A");
    expect(wrapper.findAll(".el-table__body input[type=checkbox]")).toHaveLength(1);
  });

  it("expand 列继续显示真实展开内容", async () => {
    const wrapper = mount(InTable, {
      props: {
        rowKey: "id",
        expandRowKeys: ["1"],
        headers: [
          { type: "expand", prop: "detail" },
          { prop: "name", label: "名称" },
        ],
        data: [{ id: "1", name: "成员A" }],
      },
      slots: {
        detail: ({ item }: { item: { name: string } }) =>
          h("div", { class: "row-detail" }, item.name + "详情"),
      },
      global,
    });
    await settle();
    expect(wrapper.get(".row-detail").text()).toBe("成员A详情");
  });

  it("部门树仍保留根节点关闭勾选、子节点全选与展开", async () => {
    const child = { id: "2", name: "子部门" };
    const root = { id: "1", name: "企业根", children: [child] };
    const wrapper = mount(InTable, {
      attachTo: document.body,
      props: {
        rowKey: "id",
        headers: [{ prop: "name", label: "部门" }],
        data: [root],
        treeColumn: "name",
        checkbox: (row: { id: string }) => (row.id === "1" ? "off" : "on"),
        defaultExpandAll: true,
        expandRowKeys: ["1"],
      },
      global,
    });
    await settle();
    expect(wrapper.findAll(".el-table__body input[type=checkbox]")).toHaveLength(1);
    expect(wrapper.get(".in-table-tree-expand").attributes("aria-label")).toBe("收起");
    await wrapper.get(".el-table__header input[type=checkbox]").setValue(true);
    expect(wrapper.emitted("selection-change")?.at(-1)).toEqual([[child]]);
    await wrapper.get(".in-table-tree-expand").trigger("click");
    expect(wrapper.emitted("update:expandRowKeys")?.at(-1)).toEqual([[]]);
  });
});
