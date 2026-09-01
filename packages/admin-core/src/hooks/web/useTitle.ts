import { useAppStore } from "@/stores/modules/app";

/**
 * 根据当前路由 meta.title 同步 document.title。
 * 必须在 setup 中调用一次；内部自行 watch 路由变化。
 */
export function useInWebTitle() {
  const appStore = useAppStore();
  const route = useRoute();

  const syncTitle = () => {
    const title = appStore.app.title;
    const subTitle = route.meta.title;
    document.title = subTitle ? `${subTitle} - ${title}` : title;
  };

  watch(
    () => [route.path, route.meta.title, appStore.app.title] as const,
    () => {
      nextTick(syncTitle);
    },
    { immediate: true },
  );
}
