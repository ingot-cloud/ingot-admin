import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mount } from "@vue/test-utils";
import InLoading from "./InLoading.vue";

const root = dirname(fileURLToPath(import.meta.url));

describe("InLoading", () => {
  it("加载时展示主题 SVG，且没有半透明遮罩", () => {
    const wrapper = mount(InLoading, {
      props: { loading: true },
      slots: { default: "<p>内容</p>" },
      global: {
        stubs: {
          InLoadingMark: { template: '<img class="in-loading-mark" />' },
        },
      },
    });
    expect(wrapper.find(".in-loading__cover").exists()).toBe(true);
    expect(wrapper.find(".in-loading-mark").exists()).toBe(true);
    expect(wrapper.text()).toContain("内容");
    wrapper.unmount();

    const source = readFileSync(resolve(root, "InLoading.vue"), "utf8");
    expect(source).toContain("background: transparent");
    expect(source).not.toContain("rgba(");
    expect(source).not.toContain("el-loading");
  });
});
