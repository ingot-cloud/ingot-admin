import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import InDetailDrawer from "./InDetailDrawer.vue";

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
});
