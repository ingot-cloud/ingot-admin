import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import type { HelpArticleAsset } from "../../../models/help";

const state = vi.hoisted(() => ({ image: vi.fn() }));
vi.mock("../../../runtime", () => ({ useHelpRuntime: () => state }));
const Preview = (await import("./BizHelpImagePreview.vue")).default;
const assets: HelpArticleAsset[] = ["first", "second"].map((id) => ({
  id,
  thumbnailAssetId: `${id}-thumb`,
  alt: id,
  caption: id,
  width: 800,
  height: 500,
}));
const wrappers: ReturnType<typeof mount>[] = [];
const createPreview = () => {
  const wrapper = mount(Preview, {
    props: { assets, index: 0, version: "a".repeat(64) },
    global: { stubs: { ElDialog: { template: "<div><slot name='header' /><slot /></div>" } } },
  });
  wrappers.push(wrapper);
  return wrapper;
};
describe("本域静态原图预览", () => {
  beforeEach(() => {
    state.image.mockReset().mockResolvedValue("blob:test");
  });
  afterEach(() => {
    wrappers.splice(0).forEach((wrapper) => wrapper.unmount());
  });
  it("只读取所选原图，按钮与方向键切图，手动缩放限制在50到400", async () => {
    const wrapper = createPreview();
    await flushPromises();
    expect(state.image).toHaveBeenCalledExactlyOnceWith("first", "a".repeat(64));
    await wrapper.get('[aria-label="下一张图片"]').trigger("click");
    expect(wrapper.emitted("select")?.at(-1)).toEqual([1]);
    await wrapper.setProps({ index: 1 });
    await flushPromises();
    expect(state.image).toHaveBeenLastCalledWith("second", "a".repeat(64));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));
    expect(wrapper.emitted("select")?.at(-1)).toEqual([0]);
    for (let step = 0; step < 20; step++)
      await wrapper.get('[aria-label="放大图片"]').trigger("click");
    expect(wrapper.get(".help-preview-scale").text()).toBe("400%");
    for (let step = 0; step < 20; step++)
      await wrapper.get('[aria-label="缩小图片"]').trigger("click");
    expect(wrapper.get(".help-preview-scale").text()).toBe("50%");
  });
  it("原图失败明确报错，重试成功后显示原图", async () => {
    state.image.mockRejectedValueOnce(new Error("unavailable"));
    const wrapper = createPreview();
    await flushPromises();
    expect(wrapper.text()).toContain("原图加载失败");
    expect(wrapper.find("img").exists()).toBe(false);
    await wrapper.get(".help-preview-loading button").trigger("click");
    await flushPromises();
    expect(wrapper.get("img").attributes("src")).toBe("blob:test");
    expect(state.image).toHaveBeenCalledTimes(2);
  });
  it("原图URL返回后仍等待实际加载，文件错误可重试", async () => {
    const wrapper = createPreview();
    await flushPromises();
    expect(wrapper.text()).toContain("正在加载原图");
    await wrapper.get("img").trigger("error");
    expect(wrapper.text()).toContain("原图加载失败");
    await wrapper.get(".help-preview-loading button").trigger("click");
    await flushPromises();
    await wrapper.get("img").trigger("load");
    expect(wrapper.find(".help-preview-loading").exists()).toBe(false);
  });
});
