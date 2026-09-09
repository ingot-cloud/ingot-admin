import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import InIcon from "./InIcon.vue";
import { resetAdminRuntime } from "@/runtime";

describe("InIcon", () => {
  it("用单一根节点承接 class，避免 fragment 属性告警", () => {
    resetAdminRuntime();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const wrapper = mount(InIcon, {
      props: { name: "ep:user" },
      attrs: { class: "w-[var(--in-menu-icon-size)]" },
    });

    expect(wrapper.element.tagName.toLowerCase()).toBe("span");
    expect(wrapper.classes()).toContain("in-icon");
    expect(wrapper.classes()).toContain("w-[var(--in-menu-icon-size)]");
    expect(
      warn.mock.calls.some((call) => String(call[0]).includes("Extraneous non-props attributes")),
    ).toBe(false);
    warn.mockRestore();
  });
});
