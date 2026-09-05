import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import InBizTabsHeader from "./InBizTabsHeader.vue";

describe("InBizTabsHeader", () => {
  it("方向键切换页内 Tab", async () => {
    const wrapper = mount(InBizTabsHeader, {
      props: {
        modelValue: "a",
        tabs: [
          { id: "a", title: "基本信息" },
          { id: "b", title: "权限" },
        ],
      },
    });
    await wrapper.get('[role="tablist"]').trigger("keydown", { key: "ArrowRight" });
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual(["b"]);
    expect(wrapper.emitted("change")?.[0]).toEqual(["b"]);
  });
});
