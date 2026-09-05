import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import InPageHeader from "./InPageHeader.vue";

describe("InPageHeader", () => {
  it("渲染标题、说明和操作插槽", () => {
    const wrapper = mount(InPageHeader, {
      props: { title: "成员管理", description: "管理组织成员" },
      slots: {
        action: "<button>新建</button>",
      },
      global: { stubs: { InIcon: true } },
    });
    expect(wrapper.get(".in-page-header__title").text()).toBe("成员管理");
    expect(wrapper.get(".in-page-header__description").text()).toBe("管理组织成员");
    expect(wrapper.get(".in-page-header__actions").text()).toBe("新建");
  });

  it("subtitle 作为 description 的兼容别名", () => {
    const wrapper = mount(InPageHeader, {
      props: { title: "概览", subtitle: "插件示例" },
      global: { stubs: { InIcon: true } },
    });
    expect(wrapper.get(".in-page-header__description").text()).toBe("插件示例");
  });

  it("返回按钮发出 back 事件", async () => {
    const wrapper = mount(InPageHeader, {
      props: { title: "详情", showBack: true },
      global: { stubs: { InIcon: true } },
    });
    await wrapper.get(".in-page-header__back").trigger("click");
    expect(wrapper.emitted("back")).toHaveLength(1);
  });

  it("主标题与说明使用 16/500 与 14/400，并单行省略", () => {
    const source = readFileSync(
      resolve(dirname(fileURLToPath(import.meta.url)), "InPageHeader.vue"),
      "utf8",
    );
    expect(source).toContain("font-size: var(--in-font-size-section-title)");
    expect(source).toContain("font-weight: var(--in-font-weight-section-title)");
    expect(source).toContain("font-size: var(--in-font-size-body)");
    expect(source).toContain("font-weight: var(--in-font-weight-body)");
    expect(source).toContain("word-break: break-all");
    expect(source).toContain("display: -webkit-box");
    expect(source).toContain("-webkit-line-clamp: 1");
    expect(source).not.toContain("font-size: var(--in-font-size-page-title)");
  });
});
