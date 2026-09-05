const PAGE_SCROLL_SELECTOR = ".in-page-frame__body.is-page";
const TABLE_SCROLL_SELECTOR = ".in-table__body";
const FILTER_SCROLL_SELECTOR = ".in-filter-container .inner-container";

export const resolveScrollOwner = (root?: HTMLElement | null): HTMLElement | undefined => {
  if (!root) {
    return undefined;
  }
  return (
    root.querySelector<HTMLElement>(PAGE_SCROLL_SELECTOR) ??
    root.querySelector<HTMLElement>(TABLE_SCROLL_SELECTOR) ??
    root.querySelector<HTMLElement>(FILTER_SCROLL_SELECTOR) ??
    root
  );
};
