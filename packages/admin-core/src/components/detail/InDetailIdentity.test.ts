import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import InDetailIdentity from "./InDetailIdentity.vue";

describe("InDetailIdentity", () => {
  it("渲染姓名、状态和更多操作", () => {
    const wrapper = mount(InDetailIdentity, {
      props: { name: "王超" },
      slots: {
        status: "<span class=\"status\">正常</span>",
        more: "<button type=\"button\">更多操作</button>",
      },
    });
    expect(wrapper.get(".in-detail-identity__name").text()).toBe("王超");
    expect(wrapper.get(".status").text()).toBe("正常");
    expect(wrapper.text()).toContain("更多操作");
    expect(wrapper.get(".in-avatar").attributes("style")).toContain(
      "--in-avatar-size: var(--in-avatar-size-lg)",
    );
    wrapper.unmount();
  });

  it("编辑态头像带悬停相机遮罩", () => {
    const wrapper = mount(InDetailIdentity, {
      props: { name: "池鑫", editable: true },
      global: {
        stubs: {
          ElUpload: { template: "<div class=\"el-upload\"><slot /></div>" },
        },
      },
    });
    expect(wrapper.get(".in-detail-identity__avatar").classes()).toContain("is-editable");
    expect(wrapper.find(".in-detail-identity__avatar-mask").exists()).toBe(true);
    expect(wrapper.find(".in-detail-identity__camera").exists()).toBe(true);
    wrapper.unmount();
  });
});
