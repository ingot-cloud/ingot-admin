export type OverflowMenuPlacement = "bottom" | "top";

export type OverflowMenuBox = {
  top?: number;
  bottom?: number;
  right: number;
  maxHeight: number;
  placement: OverflowMenuPlacement;
};

const GAP = 4;
const MARGIN = 8;
const DEFAULT_MAX_HEIGHT = 320;
const ITEM_HEIGHT = 36;
const LIST_CHROME = 12;

export const estimateOverflowMenuHeight = (itemCount: number): number =>
  Math.max(ITEM_HEIGHT, itemCount * ITEM_HEIGHT + LIST_CHROME + GAP);

export const resolveOverflowMenuBox = (input: {
  trigger: { top: number; bottom: number; right: number };
  menuHeight: number;
  viewport: { width: number; height: number };
}): OverflowMenuBox => {
  const needed = Math.min(Math.max(input.menuHeight, 0), DEFAULT_MAX_HEIGHT + GAP);
  const spaceBelow = input.viewport.height - input.trigger.bottom - MARGIN;
  const spaceAbove = input.trigger.top - MARGIN;
  const placeTop = spaceBelow < needed && spaceAbove > spaceBelow;
  if (placeTop) {
    return {
      bottom: input.viewport.height - input.trigger.top,
      right: input.viewport.width - input.trigger.right,
      maxHeight: Math.max(0, Math.min(DEFAULT_MAX_HEIGHT, spaceAbove - GAP)),
      placement: "top",
    };
  }
  return {
    top: input.trigger.bottom,
    right: input.viewport.width - input.trigger.right,
    maxHeight: Math.max(0, Math.min(DEFAULT_MAX_HEIGHT, spaceBelow - GAP)),
    placement: "bottom",
  };
};
