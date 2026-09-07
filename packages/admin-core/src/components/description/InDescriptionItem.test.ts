import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import InDescriptionItem from "./InDescriptionItem.vue";

describe("InDescriptionItem", () => {
  it("空值渲染为短横线", () => {
    const wrapper = mount(InDescriptionItem, {
      props: { label: "别名", value: "" },
    });
    expect(wrapper.get(".in-description-item__label").text()).toBe("别名");
    expect(wrapper.get(".in-description-item__value").text()).toBe("-");
    wrapper.unmount();
  });
});
