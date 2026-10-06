import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import InApplicationIcon from "./InApplicationIcon.vue";

const icons = vi.hoisted(() => ({ getIcon: vi.fn(), loadIcon: vi.fn() }));
vi.mock("virtual:ingot-iconify-icon", () => icons);
vi.mock("@/runtime", () => ({ getAdminRuntimeConfig: () => ({ branding: { symbol: "ingot" } }) }));
const render = (icon?: string) => mount(InApplicationIcon, {
  props: { icon }, global: { stubs: { InIcon: { props: ["name"], template: '<span :data-icon="name" />' } } },
});

beforeEach(() => { icons.getIcon.mockReset(); icons.loadIcon.mockReset(); });

describe("应用图标", () => {
  it("缺省与图片失败显示统一图标", async () => {
    const empty = render();
    expect(empty.get("span").attributes("data-icon")).toBe("ep:monitor");
    empty.unmount();
    const picture = render("https://example.test/icon.png");
    await picture.get("img").trigger("error");
    expect(picture.get("span").attributes("data-icon")).toBe("ep:monitor");
    picture.unmount();
  });

  it("已内置图标不拉取；未知Iconify失败回退", async () => {
    icons.getIcon.mockReturnValue({ body: "svg" });
    const known = render("ep:cpu");
    expect(icons.loadIcon).not.toHaveBeenCalled();
    known.unmount();
    icons.getIcon.mockReturnValue(undefined);
    icons.loadIcon.mockRejectedValue(new Error("offline"));
    const unknown = render("unknown:missing");
    await flushPromises();
    expect(unknown.get("span").attributes("data-icon")).toBe("ep:monitor");
    unknown.unmount();
  });

  it("旧图标迟到失败不能覆盖更新后的图片", async () => {
    let reject!: (error: Error) => void;
    icons.loadIcon.mockReturnValue(new Promise((_resolve, fail) => { reject = fail; }));
    const wrapper = render("unknown:slow");
    await wrapper.setProps({ icon: "https://example.test/new.png" });
    reject(new Error("late"));
    await flushPromises();
    expect(wrapper.get("img").attributes("src")).toBe("https://example.test/new.png");
    wrapper.unmount();
  });
});
