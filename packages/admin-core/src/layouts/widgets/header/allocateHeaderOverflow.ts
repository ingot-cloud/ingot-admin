export interface HeaderOverflowItem {
  key: string;
  width: number;
}

export interface HeaderOverflowInput {
  availableWidth: number;
  navItems: HeaderOverflowItem[];
  activeNavKey?: string;
  navSlotWidth: number;
  searchEnabled: boolean;
  searchFullWidth: number;
  searchCompactWidth: number;
  utilityItems: HeaderOverflowItem[];
  utilitySlotWidth: number;
  moreButtonWidth: number;
  itemGap: number;
  navItemGap?: number;
  zoneGap: number;
}

export interface HeaderOverflowResult {
  visibleNavKeys: string[];
  overflowNavKeys: string[];
  showNavMore: boolean;
  overflowNavSlot: boolean;
  searchCompact: boolean;
  visibleUtilityKeys: string[];
  overflowUtilityKeys: string[];
  showUtilityMore: boolean;
  overflowUtilitySlot: boolean;
}

const sectionWidth = (widths: number[], gap: number): number => {
  const present = widths.filter((width) => width > 0);
  if (present.length === 0) {
    return 0;
  }
  return present.reduce((sum, width) => sum + width, 0) + gap * (present.length - 1);
};

const joinZones = (widths: number[], gap: number): number => sectionWidth(widths, gap);

const pickVisibleNav = (
  items: HeaderOverflowItem[],
  visibleCount: number,
  activeKey?: string,
): { visible: HeaderOverflowItem[]; overflow: HeaderOverflowItem[] } => {
  if (visibleCount >= items.length) {
    return { visible: [...items], overflow: [] };
  }
  const count = Math.max(visibleCount, items.length > 0 ? 1 : 0);
  const selected = new Set<string>();
  const active = items.find((item) => item.key === activeKey);
  if (active) {
    selected.add(active.key);
  }
  for (const item of items) {
    if (selected.size >= count) {
      break;
    }
    selected.add(item.key);
  }
  const visible = items.filter((item) => selected.has(item.key)).slice(0, count);
  const visibleKeys = new Set(visible.map((item) => item.key));
  const overflow = items.filter((item) => !visibleKeys.has(item.key));
  return { visible, overflow };
};

const measureNav = (
  visible: HeaderOverflowItem[],
  overflowCount: number,
  navSlotWidth: number,
  overflowNavSlot: boolean,
  moreButtonWidth: number,
  gap: number,
): number => {
  const more = overflowCount > 0 || overflowNavSlot ? moreButtonWidth : 0;
  const slot = overflowNavSlot ? 0 : navSlotWidth;
  return sectionWidth(
    [...visible.map((item) => item.width), slot, more],
    gap,
  );
};

const measureUtilities = (
  visible: HeaderOverflowItem[],
  overflowCount: number,
  utilitySlotWidth: number,
  overflowUtilitySlot: boolean,
  moreButtonWidth: number,
  gap: number,
): number => {
  const more = overflowCount > 0 || overflowUtilitySlot ? moreButtonWidth : 0;
  const slot = overflowUtilitySlot ? 0 : utilitySlotWidth;
  return sectionWidth(
    [...visible.map((item) => item.width), slot, more],
    gap,
  );
};

const measureSearch = (
  enabled: boolean,
  compact: boolean,
  fullWidth: number,
  compactWidth: number,
): number => {
  if (!enabled) {
    return 0;
  }
  return compact ? compactWidth : fullWidth;
};

const measureLayout = (
  input: HeaderOverflowInput,
  visibleNav: HeaderOverflowItem[],
  overflowNavCount: number,
  overflowNavSlot: boolean,
  searchCompact: boolean,
  visibleUtilities: HeaderOverflowItem[],
  overflowUtilityCount: number,
  overflowUtilitySlot: boolean,
): number => {
  const navWidth = measureNav(
    visibleNav,
    overflowNavCount,
    input.navSlotWidth,
    overflowNavSlot,
    input.moreButtonWidth,
    input.navItemGap ?? input.itemGap,
  );
  const searchWidth = measureSearch(
    input.searchEnabled,
    searchCompact,
    input.searchFullWidth,
    input.searchCompactWidth,
  );
  const utilityWidth = measureUtilities(
    visibleUtilities,
    overflowUtilityCount,
    input.utilitySlotWidth,
    overflowUtilitySlot,
    input.moreButtonWidth,
    input.itemGap,
  );
  return joinZones([navWidth, searchWidth, utilityWidth], input.zoneGap);
};

const emptyResult = (): HeaderOverflowResult => ({
  visibleNavKeys: [],
  overflowNavKeys: [],
  showNavMore: false,
  overflowNavSlot: false,
  searchCompact: false,
  visibleUtilityKeys: [],
  overflowUtilityKeys: [],
  showUtilityMore: false,
  overflowUtilitySlot: false,
});

export const allocateHeaderOverflow = (input: HeaderOverflowInput): HeaderOverflowResult => {
  if (input.availableWidth < 0) {
    return emptyResult();
  }

  const navItems = input.navItems.filter((item) => item.width >= 0);
  const utilityItems = [...input.utilityItems];
  const minNav = navItems.length > 0 ? 1 : 0;

  let overflowNavCount = 0;
  let overflowNavSlot = false;
  let searchCompact = false;
  let overflowUtilityCount = 0;
  let overflowUtilitySlot = false;

  const current = () => {
    const packed = pickVisibleNav(
      navItems,
      navItems.length - overflowNavCount,
      input.activeNavKey,
    );
    const visibleUtilities = utilityItems.slice(0, utilityItems.length - overflowUtilityCount);
    const overflowUtilities = utilityItems.slice(utilityItems.length - overflowUtilityCount);
    const width = measureLayout(
      input,
      packed.visible,
      packed.overflow.length,
      overflowNavSlot,
      searchCompact,
      visibleUtilities,
      overflowUtilities.length,
      overflowUtilitySlot,
    );
    return { packed, visibleUtilities, overflowUtilities, width };
  };

  const fits = () => current().width <= input.availableWidth;

  while (!fits() && navItems.length - overflowNavCount > minNav) {
    overflowNavCount += 1;
  }

  if (!fits() && input.navSlotWidth > 0 && !overflowNavSlot) {
    overflowNavSlot = true;
  }

  if (!fits() && input.searchEnabled && !searchCompact) {
    searchCompact = true;
  }

  if (!fits() && input.utilitySlotWidth > 0 && !overflowUtilitySlot) {
    overflowUtilitySlot = true;
  }

  while (!fits() && overflowUtilityCount < utilityItems.length) {
    overflowUtilityCount += 1;
  }

  const { packed, visibleUtilities, overflowUtilities } = current();
  return {
    visibleNavKeys: packed.visible.map((item) => item.key),
    overflowNavKeys: packed.overflow.map((item) => item.key),
    showNavMore: packed.overflow.length > 0 || overflowNavSlot,
    overflowNavSlot,
    searchCompact,
    visibleUtilityKeys: visibleUtilities.map((item) => item.key),
    overflowUtilityKeys: overflowUtilities.map((item) => item.key),
    showUtilityMore: overflowUtilities.length > 0 || overflowUtilitySlot,
    overflowUtilitySlot,
  };
};
