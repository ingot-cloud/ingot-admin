import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import {
  InAdminHeaderNavItemType,
  InAdminHeaderNavGroupTrigger,
} from "@/plugin/header";
import InAppBarNav from "./InAppBarNav.vue";
import type { ResolvedHeaderNavItem } from "./resolveHeaderConfig";

const items: ResolvedHeaderNavItem[] = [
  {
    key: "ops",
    type: InAdminHeaderNavItemType.Action,
    label: "运营",
    disabled: false,
    trigger: InAdminHeaderNavGroupTrigger.Click,
    groups: [],
  },
  {
    key: "dev",
    type: InAdminHeaderNavItemType.Action,
    label: "研发",
    disabled: true,
    trigger: InAdminHeaderNavGroupTrigger.Click,
    groups: [],
  },
];

describe("InAppBarNav", () => {
  it("点击入口发出 select，禁用项不发出", async () => {
    const wrapper = mount(InAppBarNav, {
      props: {
        items,
        visibleKeys: ["ops", "dev"],
        overflowKeys: [],
        showMore: false,
        overflowNavSlot: false,
        activeKey: "ops",
      },
      global: {
        stubs: { InIcon: true, ElTooltip: { template: "<span><slot /></span>" } },
      },
    });
    const buttons = wrapper.findAll("button.in-app-bar-nav__item");
    expect(wrapper.find("button.in-app-bar-nav__item.is-active").text()).toBe("运营");
    await buttons[0]?.trigger("click");
    expect(wrapper.emitted("select")?.[0]).toEqual([{ entryKey: "ops" }]);
    await buttons[1]?.trigger("click");
    expect(wrapper.emitted("select")).toHaveLength(1);
    wrapper.unmount();
  });

  it("导航为空时不渲染入口或更多", () => {
    const wrapper = mount(InAppBarNav, {
      props: {
        items: [],
        visibleKeys: [],
        overflowKeys: [],
        showMore: false,
        overflowNavSlot: false,
      },
      global: {
        stubs: { InIcon: true, ElTooltip: { template: "<span><slot /></span>" } },
      },
    });
    expect(wrapper.findAll("button.in-app-bar-nav__item")).toHaveLength(0);
    expect(wrapper.find('[aria-label="更多"]').exists()).toBe(false);
    wrapper.unmount();
  });

  it("分组菜单默认 hover 打开，click 模式点击才打开", async () => {
    const groupItems: ResolvedHeaderNavItem[] = [
      {
        key: "platform",
        type: InAdminHeaderNavItemType.Group,
        label: "平台",
        disabled: false,
        trigger: InAdminHeaderNavGroupTrigger.Hover,
        groups: [
          {
            key: "system",
            title: "系统",
            items: [{ key: "app", label: "应用", disabled: false }],
          },
        ],
      },
      {
        key: "ops",
        type: InAdminHeaderNavItemType.Group,
        label: "运营",
        disabled: false,
        trigger: InAdminHeaderNavGroupTrigger.Click,
        groups: [
          {
            key: "biz",
            title: "业务",
            items: [{ key: "order", label: "订单", disabled: false }],
          },
        ],
      },
    ];
    const wrapper = mount(InAppBarNav, {
      attachTo: document.body,
      props: {
        items: groupItems,
        visibleKeys: ["platform", "ops"],
        overflowKeys: [],
        showMore: false,
        overflowNavSlot: false,
      },
      global: {
        stubs: { InIcon: true, ElTooltip: { template: "<span><slot /></span>" } },
      },
    });
    const [hoverBtn, clickBtn] = wrapper.findAll("button.in-app-bar-nav__item");
    await hoverBtn?.trigger("mouseenter");
    expect(document.body.querySelector(".in-app-bar-overlay--nav.is-open")).not.toBeNull();
    expect(hoverBtn?.classes()).toContain("is-open");
    await clickBtn?.trigger("mouseenter");
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(clickBtn?.attributes("aria-expanded")).toBe("false");
    await clickBtn?.trigger("click");
    expect(clickBtn?.attributes("aria-expanded")).toBe("true");
    wrapper.unmount();
  });
});
