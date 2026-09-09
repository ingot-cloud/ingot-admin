import type { Ref, WritableComputedRef } from "vue";

export const useAppBarOverlay = (options: {
  open: Ref<boolean> | WritableComputedRef<boolean>;
  triggerRef: Ref<HTMLElement | undefined>;
  panelRef: Ref<HTMLElement | undefined>;
  maxWidth?: number;
  align?: "start" | "end";
  offset?: number;
}): {
  panelStyle: Ref<Record<string, string>>;
  privatePlacePanel: () => void;
  privateClose: (restoreFocus?: boolean) => void;
  privateToggle: () => void;
} => {
  const panelStyle = ref<Record<string, string>>({});
  const maxWidth = options.maxWidth ?? 360;
  const align = options.align ?? "end";
  const offset = options.offset ?? 8;

  const privatePlacePanel = () => {
    const trigger = options.triggerRef.value;
    const panel = options.panelRef.value;
    if (!trigger || !panel) {
      return;
    }
    const rect = trigger.getBoundingClientRect();
    const bar = trigger.closest(".in-app-bar, .in-shell-header");
    const anchorBottom =
      bar instanceof HTMLElement ? bar.getBoundingClientRect().bottom : rect.bottom;
    const viewportMaxWidth = Math.min(maxWidth, Math.max(160, window.innerWidth - 16));
    const top = anchorBottom + offset;
    const viewportMaxHeight = Math.max(120, window.innerHeight - top - 12);
    panelStyle.value = {
      top: `${Math.round(top)}px`,
      width: "max-content",
      maxWidth: `${Math.round(viewportMaxWidth)}px`,
      maxHeight: `${Math.round(viewportMaxHeight)}px`,
    };
    const size = panel.getBoundingClientRect();
    const width = Math.min(viewportMaxWidth, Math.max(size.width, panel.scrollWidth, 160));
    const maxLeft = Math.max(8, window.innerWidth - width - 8);
    const preferredLeft = align === "start" ? rect.left : rect.right - width;
    const left = Math.min(Math.max(8, preferredLeft), maxLeft);
    panelStyle.value = {
      ...panelStyle.value,
      left: `${Math.round(left)}px`,
    };
  };

  const privateClose = (restoreFocus = false) => {
    options.open.value = false;
    if (restoreFocus) {
      options.triggerRef.value?.focus();
    }
  };

  const privateToggle = () => {
    options.open.value = !options.open.value;
    if (options.open.value) {
      nextTick(() => {
        privatePlacePanel();
        options.panelRef.value?.focus();
      });
      return;
    }
    options.triggerRef.value?.focus();
  };

  const privateOnDocumentPointer = (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof Node)) {
      return;
    }
    if (
      options.triggerRef.value?.contains(target) ||
      options.panelRef.value?.contains(target)
    ) {
      return;
    }
    if (target instanceof Element && target.closest(".el-popper, .el-overlay")) {
      return;
    }
    privateClose();
  };

  watch(options.open, (visible) => {
    if (visible) {
      document.addEventListener("mousedown", privateOnDocumentPointer);
      window.addEventListener("scroll", privatePlacePanel, true);
      window.addEventListener("resize", privatePlacePanel);
      return;
    }
    document.removeEventListener("mousedown", privateOnDocumentPointer);
    window.removeEventListener("scroll", privatePlacePanel, true);
    window.removeEventListener("resize", privatePlacePanel);
  });

  onBeforeUnmount(() => {
    document.removeEventListener("mousedown", privateOnDocumentPointer);
    window.removeEventListener("scroll", privatePlacePanel, true);
    window.removeEventListener("resize", privatePlacePanel);
  });

  return {
    panelStyle,
    privatePlacePanel,
    privateClose,
    privateToggle,
  };
};
