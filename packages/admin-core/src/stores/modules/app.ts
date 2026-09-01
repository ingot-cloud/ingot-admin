import type { AppStore } from "../types";
import type { ComponentSize } from "@/layouts/widgets/cmp-size/types";
import { getAdminRuntimeConfig } from "@/runtime";

/**
 * 全局配置
 */
export const useAppStore = defineStore("app", () => {
  const now = new Date();
  const runtime = getAdminRuntimeConfig();
  const app = reactive<AppStore>({
    title: runtime.branding.title,
    copyright: runtime.branding.copyright.replace("{0}", String(now.getFullYear())),
    login: {
      loginUri: runtime.login.loginUri,
      loginCallbackUri: runtime.login.callbackUri,
      errorImage: runtime.login.errorImage,
      fingerprintEnabled: runtime.login.fingerprintEnabled,
    },
    netConfig: {
      baseURL: runtime.net.baseURL,
      timeout: runtime.net.timeout,
      timeoutErrorMessage: runtime.net.timeoutErrorMessage,
    },
    basicToken: runtime.basicToken ? `Basic ${runtime.basicToken}` : "",
    bucketName: runtime.bucketName,
  });

  const getBasicToken = computed(() => app.basicToken);

  return {
    app,
    getBasicToken,
  };
});

/**
 * app状态
 */
export const useAppStateStore = defineStore(
  "app.state",
  () => {
    const menuOpenStatus = ref<boolean | undefined>(undefined);
    const componentSize = ref<ComponentSize | undefined>(undefined);
    const showTabs = ref<boolean | undefined>(undefined);
    const showBreadcrumb = ref<boolean | undefined>(undefined);
    const showCopyright = ref<boolean | undefined>(undefined);
    const showSearch = ref<boolean | undefined>(undefined);
    const showWatermark = ref<boolean | undefined>(undefined);
    onMounted(() => {
      const settings = getAdminRuntimeConfig().settings;
      if (menuOpenStatus.value === undefined) {
        menuOpenStatus.value = settings.showMenu;
      }
      if (componentSize.value === undefined) {
        componentSize.value = settings.componentSize;
      }
      if (showTabs.value === undefined) {
        showTabs.value = settings.showTabs;
      }
      if (showBreadcrumb.value === undefined) {
        showBreadcrumb.value = settings.showBreadcrumb;
      }
      if (showCopyright.value === undefined) {
        showCopyright.value = settings.showCopyright;
      }
      if (showSearch.value === undefined) {
        showSearch.value = settings.showSearch;
      }
      if (showWatermark.value === undefined) {
        showWatermark.value = settings.showWatermark;
      }
    });

    const getMenuOpened = computed(() => {
      return menuOpenStatus.value;
    });
    const getShowTabs = computed(() => {
      return showTabs.value;
    });
    const getShowBreadcrumb = computed(() => {
      return showBreadcrumb.value;
    });
    const getShowCopyright = computed(() => {
      return showCopyright.value;
    });
    const getShowSearch = computed(() => {
      return showSearch.value;
    });
    const getShowWatermark = computed(() => {
      return showWatermark.value;
    });

    const toggleMenu = () => {
      menuOpenStatus.value = !menuOpenStatus.value;
    };
    const changeComponentSize = (size: ComponentSize) => {
      componentSize.value = size;
    };

    return {
      menuOpenStatus,
      componentSize,
      showTabs,
      showBreadcrumb,
      showCopyright,
      showSearch,
      showWatermark,
      getMenuOpened,
      getShowTabs,
      getShowBreadcrumb,
      getShowCopyright,
      getShowSearch,
      getShowWatermark,
      toggleMenu,
      changeComponentSize,
    };
  },
  {
    persist: {
      storage: localStorage,
      pick: [
        "menuOpenStatus",
        "componentSize",
        "showTabs",
        "showBreadcrumb",
        "showCopyright",
        "showSearch",
        "showWatermark",
      ],
    },
  },
);
