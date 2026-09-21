import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import InForm from "./InForm.vue";
import InDetailField from "./InDetailField.vue";

const formItemStub = {
  props: ["label", "prop", "required"],
  template:
    '<div class="item" :data-prop="prop" :data-required="required"><span class="label">{{ label }}</span><slot /></div>',
};

describe("InForm", () => {
  it("查看态不加 is-editing，编辑态加上", async () => {
    const wrapper = mount(InForm, {
      props: { editing: false },
      global: {
        stubs: {
          ElForm: { template: '<form class="el-form" :class="$attrs.class"><slot /></form>' },
        },
      },
    });
    expect(wrapper.get("form").classes()).toContain("in-detail-form");
    expect(wrapper.get("form").classes()).not.toContain("is-editing");
    await wrapper.setProps({ editing: true });
    expect(wrapper.get("form").classes()).toContain("is-editing");
    wrapper.unmount();
  });
});

describe("InDetailField", () => {
  it("查看态展示值，编辑态展示输入插槽", async () => {
    const wrapper = mount(InDetailField, {
      props: { label: "组织名称", value: "测试组织B", editing: false },
      slots: { default: '<input class="editor" />' },
      global: { stubs: { ElFormItem: formItemStub } },
    });
    expect(wrapper.get(".label").text()).toBe("组织名称");
    expect(wrapper.get(".in-detail-field__value").text()).toBe("测试组织B");
    expect(wrapper.find(".in-detail-field__editor").exists()).toBe(true);
    expect(wrapper.get(".in-detail-field").classes()).not.toContain("is-editing");
    expect(wrapper.get(".in-detail-field").classes()).toContain("has-editor");

    await wrapper.setProps({ editing: true });
    expect(wrapper.get(".in-detail-field").classes()).toContain("is-editing");
    expect(wrapper.find(".editor").exists()).toBe(true);
    wrapper.unmount();
  });

  it("没有编辑插槽时编辑态仍展示查看内容", () => {
    const wrapper = mount(InDetailField, {
      props: { label: "所有者", value: "池鑫", editing: true },
      global: { stubs: { ElFormItem: formItemStub } },
    });
    expect(wrapper.get(".in-detail-field__value").text()).toBe("池鑫");
    expect(wrapper.find(".in-detail-field__editor").exists()).toBe(false);
    expect(wrapper.get(".in-detail-field").classes()).not.toContain("has-editor");
    wrapper.unmount();
  });
});
