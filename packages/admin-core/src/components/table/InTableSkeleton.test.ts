import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import InTableSkeleton from "./InTableSkeleton.vue";

describe("InTableSkeleton", () => {
  it("按列数渲染骨架行，选择列更窄", () => {
    const wrapper = mount(InTableSkeleton, {
      props: {
        rows: 3,
        columns: [
          { type: "selection", prop: "selection" },
          { prop: "name", label: "名称" },
        ],
      },
    });
    expect(wrapper.findAll(".in-table-skeleton__row")).toHaveLength(3);
    expect(wrapper.findAll(".in-table-skeleton__cell.is-control")).toHaveLength(3);
    expect(wrapper.attributes("aria-label")).toBe("加载中");
    wrapper.unmount();
  });
});
