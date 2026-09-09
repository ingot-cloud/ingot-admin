import { defineComponent, nextTick, ref } from "vue";
import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAppBarOverlay } from "./useAppBarOverlay";

const OverlayHost = defineComponent({
  setup() {
    const open = ref(false);
    const triggerRef = ref<HTMLElement>();
    const panelRef = ref<HTMLElement>();
    const overlay = useAppBarOverlay({
      open,
      triggerRef,
      panelRef,
      align: "start",
      offset: 8,
    });
    return { open, triggerRef, panelRef, ...overlay };
  },
  template: `
    <div class="in-app-bar">
      <button ref="triggerRef" class="trigger">平台</button>
    </div>
    <div ref="panelRef" class="panel">panel</div>
  `,
});

describe("useAppBarOverlay", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("面板放在顶栏下方并与触发器左对齐", async () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
      this: HTMLElement,
    ) {
      if (this.classList.contains("in-app-bar")) {
        return {
          x: 0,
          y: 0,
          width: 1200,
          height: 56,
          top: 0,
          left: 0,
          bottom: 56,
          right: 1200,
          toJSON: () => undefined,
        };
      }
      if (this.classList.contains("trigger")) {
        return {
          x: 200,
          y: 10,
          width: 80,
          height: 36,
          top: 10,
          left: 200,
          bottom: 46,
          right: 280,
          toJSON: () => undefined,
        };
      }
      return {
        x: 0,
        y: 0,
        width: 240,
        height: 120,
        top: 0,
        left: 0,
        bottom: 120,
        right: 240,
        toJSON: () => undefined,
      };
    });
    const wrapper = mount(OverlayHost, { attachTo: document.body });
    wrapper.vm.open = true;
    wrapper.vm.privatePlacePanel();
    await nextTick();
    expect(wrapper.vm.panelStyle.top).toBe("64px");
    expect(wrapper.vm.panelStyle.left).toBe("200px");
    expect(wrapper.vm.panelStyle.width).toBe("max-content");
    expect(wrapper.vm.panelStyle.maxWidth).toBe("360px");
    wrapper.unmount();
  });
});
