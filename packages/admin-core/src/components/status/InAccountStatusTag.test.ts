import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import InAccountStatusTag from "./InAccountStatusTag.vue";

describe("InAccountStatusTag", () => {
  it("可用且未锁定时展示正常", () => {
    const wrapper = mount(InAccountStatusTag, {
      props: { enabled: true, locked: false },
    });
    expect(wrapper.get(".in-status-tag").classes()).toContain("is-info");
    expect(wrapper.get(".in-status-tag__content").text()).toBe("正常");
    wrapper.unmount();
  });

  it("不可用时展示已暂停，优先于锁定", () => {
    const paused = mount(InAccountStatusTag, {
      props: { enabled: false, locked: false },
    });
    expect(paused.get(".in-status-tag").classes()).toContain("is-warning");
    expect(paused.get(".in-status-tag__content").text()).toBe("已暂停");
    paused.unmount();

    const pausedAndLocked = mount(InAccountStatusTag, {
      props: { enabled: false, locked: true },
    });
    expect(pausedAndLocked.get(".in-status-tag").classes()).toContain("is-warning");
    expect(pausedAndLocked.get(".in-status-tag__content").text()).toBe("已暂停");
    pausedAndLocked.unmount();
  });

  it("可用但锁定时展示已锁定", () => {
    const wrapper = mount(InAccountStatusTag, {
      props: { enabled: true, locked: true },
    });
    expect(wrapper.get(".in-status-tag").classes()).toContain("is-danger");
    expect(wrapper.get(".in-status-tag__content").text()).toBe("已锁定");
    wrapper.unmount();
  });
});
