import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import InAvatar from "./InAvatar.vue";

describe("InAvatar", () => {
  it("无头像时圆圈显示姓名最后两个字", () => {
    const wrapper = mount(InAvatar, {
      props: { name: "欧阳修" },
    });
    expect(wrapper.get(".in-avatar__fallback").text()).toBe("阳修");
    expect(wrapper.get(".in-avatar-field__name").text()).toBe("欧阳修");
    expect(wrapper.find(".in-avatar__image").exists()).toBe(false);
    wrapper.unmount();
  });

  it("有头像时渲染图片并保留姓名", () => {
    const wrapper = mount(InAvatar, {
      props: { name: "王超", src: "https://example.com/a.png" },
    });
    expect(wrapper.get(".in-avatar__image").attributes("src")).toBe("https://example.com/a.png");
    expect(wrapper.find(".in-avatar__fallback").exists()).toBe(false);
    expect(wrapper.get(".in-avatar-field__name").text()).toBe("王超");
    wrapper.unmount();
  });

  it("showAvatar 为 false 时只显示文本", () => {
    const wrapper = mount(InAvatar, {
      props: { name: "王超", src: "https://example.com/a.png", showAvatar: false },
    });
    expect(wrapper.find(".in-avatar").exists()).toBe(false);
    expect(wrapper.get(".in-avatar-field__name").text()).toBe("王超");
    wrapper.unmount();
  });

  it("color 覆盖默认主题色", () => {
    const wrapper = mount(InAvatar, {
      props: { name: "池鑫", color: "#8b5cf6" },
    });
    expect(wrapper.get(".in-avatar").attributes("style")).toContain("--in-avatar-color: #8b5cf6");
    wrapper.unmount();
  });

  it("avatar 作为 src 别名", () => {
    const wrapper = mount(InAvatar, {
      props: { name: "王超", avatar: "/logo.png" },
    });
    expect(wrapper.get(".in-avatar__image").attributes("src")).toBe("/logo.png");
    wrapper.unmount();
  });
});
