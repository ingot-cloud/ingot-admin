import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import InTable from "./InTable.vue";
import { emptyIllustration } from "./emptyIllustration";

const stubs = {
  ElTable: {
    props: ["height"],
    template: '<div class="el-table-stub" :data-height="height"><slot /><slot name="empty" /></div>',
  },
  ElTableColumn: true,
  ElEmpty: {
    props: ["description", "image"],
    template: '<div class="empty" :data-image="image">{{ description }}</div>',
  },
  ElPagination: { template: '<div class="pager" />' },
};

describe("InTable", () => {
  it("暂无数据使用 no_data 插图", () => {
    setActivePinia(createPinia());
    const wrapper = mount(InTable, {
      props: {
        headers: [{ prop: "name", label: "名称" }],
        data: [],
      },
      global: { stubs },
    });
    expect(wrapper.get(".empty").text()).toBe("暂无数据");
    expect(wrapper.get(".empty").attributes("data-image")).toBe(emptyIllustration);
    wrapper.unmount();
  });

  it("区分空数据与无搜索结果反馈", () => {
    setActivePinia(createPinia());
    const wrapper = mount(InTable, {
      props: {
        headers: [{ prop: "name", label: "名称" }],
        data: [],
        feedback: "no-result",
      },
      global: { stubs },
    });
    expect(wrapper.get(".empty").text()).toBe("无搜索结果");
    expect(wrapper.get(".empty").attributes("data-image")).toBe(emptyIllustration);
    expect(wrapper.find("[aria-label='刷新']").exists()).toBe(false);
    expect(wrapper.findComponent({ name: "InColumnSetting" }).exists()).toBe(false);
    wrapper.unmount();
  });

  it("全高 flex：Meta/Tools/分页固定，数据区承担滚动", () => {
    setActivePinia(createPinia());
    const wrapper = mount(InTable, {
      props: {
        headers: [
          { type: "selection", prop: "selection" },
          { prop: "name", label: "名称" },
          { prop: "actions", label: "操作" },
        ],
        data: Array.from({ length: 200 }, (_, index) => ({ name: `row-${index}` })),
        page: { current: 1, size: 20, total: 200 },
        tableId: "member-list",
        density: "compact",
      },
      slots: {
        title: "成员",
        "tools-end": "<button class='end-tool'>添加</button>",
      },
      global: { stubs },
    });
    expect(wrapper.get(".in-table").classes()).toContain("is-compact");
    expect(wrapper.get(".el-table-stub").attributes("data-height")).toBe("100%");
    expect(wrapper.find(".in-table__pagination").exists()).toBe(true);
    expect(wrapper.get(".in-table__tools-end .end-tool").exists()).toBe(true);
    wrapper.unmount();
  });

  it("旧 toolbar 映射到 tools-start，且不把行操作列 #actions 渲染到工具栏", () => {
    setActivePinia(createPinia());
    const wrapper = mount(InTable, {
      props: {
        headers: [{ prop: "actions", label: "操作" }],
        data: [],
      },
      slots: {
        toolbar: "<span class='legacy-tool'>筛选</span>",
        actions: `<span class="row-action">{{ item.status }}</span>`,
      },
      global: {
        stubs: {
          ElTable: { template: '<div class="el-table-stub"><slot /></div>' },
          ElTableColumn: true,
          ElEmpty: true,
          ElPagination: true,
        },
      },
    });
    expect(wrapper.get(".in-table__tools-start .legacy-tool").text()).toBe("筛选");
    expect(wrapper.find(".in-table__tools-end .row-action").exists()).toBe(false);
    wrapper.unmount();
  });

  it("headers.hide 变化时同步可见列", async () => {
    setActivePinia(createPinia());
    const wrapper = mount(InTable, {
      props: {
        headers: [
          { prop: "name", label: "名称" },
          { prop: "phone", label: "手机号" },
        ],
        data: [{ name: "Ada", phone: "1" }],
      },
      global: { stubs },
    });
    await wrapper.setProps({
      headers: [
        { prop: "name", label: "名称" },
        { prop: "phone", label: "手机号", hide: true },
      ],
    });
    const columns = wrapper.findAllComponents({ name: "ElTableColumn" });
    expect(columns.map((item) => item.props("prop") ?? item.attributes("prop"))).toEqual(["name"]);
    wrapper.unmount();
  });

  it("使用模板 ElTable 并让表格自身滚动，避免露出 hidden-columns 和双滚动条", () => {
    const source = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "InTable.vue"), "utf8");
    expect(source).toContain("<el-table");
    expect(source).not.toContain("h(ElTable");
    expect(source).toContain("element-plus/theme-chalk/el-table.css");
    expect(source).toContain(".in-table__body");
    expect(source).toMatch(/\.in-table__body \{[\s\S]*?overflow: hidden;/);
    expect(source).toContain(".hidden-columns");
    expect(source).toContain("emptyIllustration");
    expect(source).toContain("暂无数据");
  });
});
