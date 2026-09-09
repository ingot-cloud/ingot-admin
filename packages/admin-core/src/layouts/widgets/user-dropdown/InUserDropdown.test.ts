import { beforeEach, describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import InUserDropdown from "./InUserDropdown.vue";
import { useUserInfoStore } from "@/stores/modules/auth";
import { USER_MENU_LOGOUT_DIVIDER_KEY } from "./normalizeUserMenuItems";
import {
  InAdminHeaderBuiltinUserMenuName,
  InAdminHeaderUserMenuItemType,
} from "@/plugin/header";

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
        FixPwdDialog: { template: "<div />" },
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

  it("空菜单不渲染下拉箭头", () => {
    useUserInfoStore().userInfo.user = { nickname: "欧阳修" };
    const wrapper = mount(InUserDropdown, {
      props: { menu: [] },
      global: {
        stubs: {
          ElDropdown: {
            template: "<div class='dropdown'><slot /><slot name='dropdown' /></div>",
          },
          ElDropdownMenu: { template: "<div><slot /></div>" },
          ElDropdownItem: { template: "<div><slot /></div>" },
          InIcon: true,
          FixPwdDialog: { template: "<div />" },
        },
      },
    });
    expect(wrapper.find(".dropdown").exists()).toBe(false);
    expect(wrapper.find(".avatar-arrow").exists()).toBe(false);
    expect(wrapper.get(".in-avatar__fallback").text()).toBe("阳修");
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

  it("头像区下方与退出登录上方固定分割线，配置分割线不占菜单项高度", () => {
    useUserInfoStore().userInfo.user = { nickname: "欧阳修" };
    const wrapper = mount(InUserDropdown, {
      props: {
        menu: [
          {
            key: "profile",
            type: InAdminHeaderUserMenuItemType.Action,
            label: "个人资料",
            disabled: false,
          },
          { key: "mid", type: InAdminHeaderUserMenuItemType.Divider, label: "", disabled: false },
          {
            key: InAdminHeaderBuiltinUserMenuName.FixPwd,
            type: InAdminHeaderUserMenuItemType.Builtin,
            name: InAdminHeaderBuiltinUserMenuName.FixPwd,
            label: "修改密码",
            disabled: false,
          },
          {
            key: InAdminHeaderBuiltinUserMenuName.Logout,
            type: InAdminHeaderUserMenuItemType.Builtin,
            name: InAdminHeaderBuiltinUserMenuName.Logout,
            label: "退出登录",
            disabled: false,
          },
        ],
      },
      global: {
        stubs: {
          ElDropdown: {
            template: "<div class='dropdown'><slot /><slot name='dropdown' /></div>",
          },
          ElDropdownMenu: { template: "<div class='user-dropdown'><slot /></div>" },
          ElDropdownItem: { template: "<div class='item'><slot /></div>" },
          InIcon: true,
          FixPwdDialog: { template: "<div />" },
        },
      },
    });
    expect(wrapper.get("[data-testid='user-dropdown-header-divider']").exists()).toBe(true);
    expect(wrapper.get("[data-testid='user-dropdown-divider-mid']").exists()).toBe(true);
    expect(wrapper.get(`[data-testid='user-dropdown-divider-${USER_MENU_LOGOUT_DIVIDER_KEY}']`).exists()).toBe(
      true,
    );
    expect(wrapper.find(".el-dropdown-menu__item--divided").exists()).toBe(false);
    wrapper.unmount();
  });
});
