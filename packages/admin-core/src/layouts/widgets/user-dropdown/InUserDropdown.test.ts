import { beforeEach, describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import InUserDropdown from "./InUserDropdown.vue";
import { useUserInfoStore } from "@/stores/modules/auth";

const mountDropdown = () =>
  mount(InUserDropdown, {
    global: {
      stubs: {
        ElDropdown: {
          template: "<div class='dropdown'><slot /><slot name='dropdown' /></div>",
        },
        ElDropdownMenu: { template: "<div><slot /></div>" },
        ElDropdownItem: { template: "<div><slot /></div>" },
        InIcon: true,
        Icon: true,
        FixPwdDrawer: { template: "<div />" },
      },
    },
  });

describe("InUserDropdown", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("无头像时显示用户名最后两个字", () => {
    useUserInfoStore().userInfo.user = { nickname: "欧阳修" };
    const wrapper = mountDropdown();
    expect(wrapper.get(".in-avatar__fallback").text()).toBe("阳修");
    expect(wrapper.find(".in-avatar__image").exists()).toBe(false);
    wrapper.unmount();
  });

  it("头像加载失败时回退到姓名最后两个字", async () => {
    useUserInfoStore().userInfo.user = {
      nickname: "欧阳修",
      avatar: "https://example.com/broken.png",
    };
    const wrapper = mountDropdown();
    await wrapper.get(".in-avatar__image").trigger("error");
    expect(wrapper.get(".in-avatar__fallback").text()).toBe("阳修");
    wrapper.unmount();
  });
});
