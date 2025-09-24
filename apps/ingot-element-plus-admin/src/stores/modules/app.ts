import type { AppStore } from "../types";
import type { ComponentSize } from "@/layouts/widgets/cmp-size/types";
import { parseBoolean } from "@/utils";

/**
 * 全局配置
 */
export const useAppStore = defineStore("app", () => {
  const now = new Date();
  const app = reactive<AppStore>({
    title: import.meta.env.VITE_APP_TITLE,
    copyright: import.meta.env.VITE_APP_COPYRIGHT.replace("{0}", now.getFullYear() + ""),
    login: {
      clientId: import.meta.env.VITE_APP_LOGIN_CLIENT_ID,
      scope: import.meta.env.VITE_APP_LOGIN_SCOPE,
      loginUri: import.meta.env.VITE_APP_LOGIN_URI,
      loginCallbackUri: import.meta.env.VITE_APP_LOGIN_CALLBACK_URI,
      errorImage: import.meta.env.VITE_APP_ERROR_IMAGE,
    },
    netConfig: {
      baseURL: import.meta.env.VITE_APP_NET_BASE_URL || undefined,
      timeout: import.meta.env.VITE_APP_NET_DEFAULT_TIMEOUT || 10_000,
      timeoutErrorMessage: import.meta.env.VITE_APP_NET_DEFAULT_TIMEOUT_MESSAGE || undefined,
    },
    basicToken: `Basic ${import.meta.env.VITE_APP_BASIC_TOKEN}`,
    bucketName: import.meta.env.VITE_APP_BUCKET_NAME,
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
      if (menuOpenStatus.value === undefined) {
        menuOpenStatus.value = parseBoolean(import.meta.env.VITE_APP_SETTINGS_SHOW_MENU);
      }
      if (componentSize.value === undefined) {
        componentSize.value = import.meta.env.VITE_APP_SETTINGS_COMPONENT_SIZE as ComponentSize;
      }
      if (showTabs.value === undefined) {
        showTabs.value = parseBoolean(import.meta.env.VITE_APP_SETTINGS_SHOW_TABS);
      }
      if (showBreadcrumb.value === undefined) {
        showBreadcrumb.value = parseBoolean(import.meta.env.VITE_APP_SETTINGS_SHOW_BREADCRUMB);
      }
      if (showCopyright.value === undefined) {
        showCopyright.value = parseBoolean(import.meta.env.VITE_APP_SETTINGS_SHOW_COPYRIGHT);
      }
      if (showSearch.value === undefined) {
        showSearch.value = parseBoolean(import.meta.env.VITE_APP_SETTINGS_SHOW_SEARCH);
      }
      if (showWatermark.value === undefined) {
        showWatermark.value = parseBoolean(import.meta.env.VITE_APP_SETTINGS_SHOW_WATERMARK);
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
