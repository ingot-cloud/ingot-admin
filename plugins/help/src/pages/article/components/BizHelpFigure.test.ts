import { afterEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
const state = vi.hoisted(() => ({ image: vi.fn(async () => "/static/tenant-flow-thumb.png") }));
vi.mock("../../../runtime", () => ({ useHelpRuntime: () => state }));
const Figure = (await import("./BizHelpFigure.vue")).default;
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
describe("静态说明缩略图", () => {
  it("图片真正加载后才能预览，文件加载失败显示重试和图注", async () => {
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(private readonly callback: (entries: { isIntersecting: boolean }[]) => void) {}
        observe() {
          this.callback([{ isIntersecting: true }]);
        }
        disconnect() {}
      },
    );
    const wrapper = mount(Figure, {
      props: {
        version: "2026.11-static",
        asset: {
          id: "tenant-flow",
          thumbnailAssetId: "tenant-flow-thumb",
          alt: "角色关系",
          caption: "概念图",
          width: 800,
          height: 400,
        },
      },
      global: { stubs: { InIcon: true } },
    });
    try {
      await flushPromises();
      expect(wrapper.get(".help-figure-open").attributes("disabled")).toBeDefined();
      await wrapper.get("img").trigger("load");
      expect(wrapper.get(".help-figure-open").attributes("disabled")).toBeUndefined();
      await wrapper.get(".help-figure-open").trigger("click");
      expect(wrapper.emitted("preview")).toEqual([["tenant-flow"]]);
      await wrapper.get("img").trigger("error");
      expect(wrapper.text()).toContain("配图暂不可用");
      expect(wrapper.get("figcaption").text()).toBe("概念图");
      await wrapper.get(".help-text-button").trigger("click");
      await flushPromises();
      expect(state.image).toHaveBeenCalledTimes(2);
      await wrapper.get("img").trigger("load");
      expect(wrapper.text()).toContain("点击查看大图");
    } finally {
      wrapper.unmount();
    }
  });
});
