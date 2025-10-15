import router from "@/router";
import { useAppStore } from "@/stores/modules/app";

export function useInWebTitle() {
  const appStore = useAppStore();
  nextTick(() => {
    const title: string = appStore.app.title;
    const subTitle = router.currentRoute.value.meta.title;
    document.title = subTitle ? `${subTitle} - ${title}` : title;
  });
}
