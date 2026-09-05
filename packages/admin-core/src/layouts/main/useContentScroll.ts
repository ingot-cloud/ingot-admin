import { resolveScrollOwner } from "./scrollOwner";

export const useContentScroll = (target: Ref<HTMLElement | undefined>) => {
  const route = useRoute();
  const positions = new Map<string, { top: number; left: number }>();
  let lastPath = route.fullPath;

  const currentOwner = (): HTMLElement | undefined => resolveScrollOwner(target.value);

  const save = (path: string) => {
    const el = currentOwner();
    if (!el) {
      return;
    }
    positions.set(path, { top: el.scrollTop, left: el.scrollLeft });
  };

  const restore = (path: string) => {
    const el = currentOwner();
    if (!el) {
      return;
    }
    const pos = positions.get(path);
    el.scrollTop = pos?.top ?? 0;
    el.scrollLeft = pos?.left ?? 0;
  };

  watch(
    () => route.fullPath,
    (path) => {
      save(lastPath);
      lastPath = path;
      nextTick(() => restore(path));
    },
  );

  onBeforeUnmount(() => {
    save(lastPath);
  });

  return {
    save,
    restore,
    positions,
  };
};
