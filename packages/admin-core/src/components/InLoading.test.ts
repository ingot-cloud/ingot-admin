import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mount } from "@vue/test-utils";
import InLoading from "./InLoading.vue";

const root = dirname(fileURLToPath(import.meta.url));

describe("InLoading", () => {
  it("加载时罩住当前区域，并用圆角底把转圈和页面分开", () => {
    const wrapper = mount(InLoading, {
      props: { loading: true },
      slots: { default: "<p>内容</p>" },
      global: {
        stubs: {
          InLoadingMark: {
            props: ["overlay", "size", "hint"],
            template:
              '<div class="in-loading-mark-overlay is-local" :data-overlay="overlay"><img class="in-loading-mark" /></div>',
          },
        },
      },
    });
    expect(wrapper.find(".in-loading-mark-overlay.is-local").exists()).toBe(true);
    expect(wrapper.find(".in-loading-mark").exists()).toBe(true);
    expect(wrapper.text()).toContain("内容");
    expect(wrapper.find(".in-loading__content").exists()).toBe(true);
    wrapper.unmount();

    const source = readFileSync(resolve(root, "InLoading.vue"), "utf8");
    expect(source).toContain("in-loading__content");
    expect(source).toContain(":only-child");
    expect(source).toContain('overlay: "local"');
    expect(source).not.toContain("el-loading");
  });
});
