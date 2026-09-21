import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";
import InDetailDrawer from "./InDetailDrawer.vue";
import InBizTabPanel from "../tabs/InBizTabPanel.vue";

const { confirmUnsavedChanges } = vi.hoisted(() => ({
  confirmUnsavedChanges: vi.fn(),
}));

vi.mock("@/hooks/components/useDetailEditSession", () => ({
  confirmUnsavedChanges: (...args: Array<unknown>) => confirmUnsavedChanges(...args),
}));

describe("InDetailDrawer", () => {
  it("查看态只显示编辑按钮，编辑态显示取消和保存", async () => {
    const wrapper = mount(InDetailDrawer, {
      props: {
        modelValue: true,
        tab: "basic",
        editing: false,
        title: "成员详情",
        editLabel: "编辑基本信息",
      },
      global: {
        stubs: {
          InDrawer: {
            props: ["title", "layout"],
            template:
              "<div class=\"drawer\" :data-layout=\"layout\"><div class=\"title\">{{ title }}</div><slot /><slot name=\"footer\" /></div>",
          },
          InBizTabs: { template: "<div class=\"tabs\"><slot /></div>" },
          InButton: { template: "<button><slot /></button>" },
        },
      },
    });
    expect(wrapper.get(".title").text()).toBe("成员详情");
    expect(wrapper.get(".drawer").attributes("data-layout")).toBe("pinned");
    expect(wrapper.text()).toContain("编辑基本信息");
    expect(wrapper.text()).not.toContain("保存");

    await wrapper.setProps({ editing: true });
    expect(wrapper.text()).toContain("取消");
    expect(wrapper.text()).toContain("保存");
    wrapper.unmount();
  });

  it("编辑态关闭前确认，取消则不关闭", async () => {
    confirmUnsavedChanges.mockResolvedValue(false);
    let closed = false;
    const wrapper = mount(InDetailDrawer, {
      props: {
        modelValue: true,
        tab: "basic",
        editing: true,
        title: "成员详情",
      },
      global: {
        stubs: {
          InDrawer: {
            props: ["beforeClose"],
            template: "<div><slot /><slot name=\"footer\" /><button class=\"close\" @click=\"run\" /></div>",
            setup(props: { beforeClose?: (done: () => void) => void }) {
              const run = () => {
                props.beforeClose?.(() => {
                  closed = true;
                });
              };
              return { run };
            },
          },
          InBizTabs: { template: "<div />" },
          InButton: { template: "<button><slot /></button>" },
        },
      },
    });
    await wrapper.get(".close").trigger("click");
    await Promise.resolve();
    expect(confirmUnsavedChanges).toHaveBeenCalled();
    expect(closed).toBe(false);
    wrapper.unmount();
  });

  it("当前 Tab 不可编辑时不显示编辑按钮和页脚", async () => {
    const wrapper = mount(InDetailDrawer, {
      props: {
        modelValue: true,
        tab: "owner",
        editing: false,
        title: "组织详情",
      },
      slots: {
        default: () => [
          h(InBizTabPanel, { title: "基础信息", name: "base" }, () => "base"),
          h(InBizTabPanel, { title: "所有者", name: "owner", editable: false }, () => "owner"),
        ],
      },
      global: {
        stubs: {
          InDrawer: {
            template:
              '<div class="drawer"><slot /><slot name="footer" /></div>',
          },
          InBizTabsHeader: { template: "<div />" },
          InButton: { template: "<button><slot /></button>" },
        },
        components: { InBizTabPanel },
      },
    });
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).not.toContain("编辑");
    expect(wrapper.text()).not.toContain("保存");

    await wrapper.setProps({ tab: "base" });
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain("编辑");
    wrapper.unmount();
  });

  it("加载中展示表单骨架并隐藏页脚", () => {
    const wrapper = mount(InDetailDrawer, {
      props: {
        modelValue: true,
        tab: "base",
        editing: false,
        loading: true,
        title: "组织详情",
      },
      global: {
        stubs: {
          InDrawer: {
            template: '<div class="drawer"><slot /><slot name="footer" /></div>',
          },
          InBizTabs: { template: "<div class=\"tabs\"><slot /></div>" },
          InFormSkeleton: { template: '<div class="in-form-skeleton">加载中</div>' },
          InButton: { template: "<button><slot /></button>" },
        },
      },
    });
    expect(wrapper.find(".in-form-skeleton").exists()).toBe(true);
    expect(wrapper.text()).not.toContain("编辑");
    wrapper.unmount();
  });

  it("点击编辑会发出 edit", async () => {
    const wrapper = mount(InDetailDrawer, {
      props: {
        modelValue: true,
        tab: "base",
        editing: false,
        title: "组织详情",
      },
      global: {
        stubs: {
          InDrawer: {
            template: '<div class="drawer"><slot /><slot name="footer" /></div>',
          },
          InBizTabs: { template: "<div class=\"tabs\"><slot /></div>" },
          InButton: {
            template: "<button class=\"edit-btn\" @click=\"$emit('in-click')\"><slot /></button>",
          },
        },
      },
    });
    await wrapper.get(".edit-btn").trigger("click");
    expect(wrapper.emitted("edit")).toHaveLength(1);
    expect(wrapper.emitted("update:editing")?.[0]).toEqual([true]);
    wrapper.unmount();
  });
});
