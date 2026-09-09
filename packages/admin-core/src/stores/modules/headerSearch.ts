import { useUserInfoStore } from "./auth";
import {
  clearSearchHistoryForUser,
  pushSearchHistoryKeyword,
  resolveSearchHistoryUserKey,
} from "@/layouts/widgets/search/searchHistory";

export const useHeaderSearchStore = defineStore(
  "header.search",
  () => {
    const userStore = useUserInfoStore();
    const historiesByUser = ref<Record<string, string[]>>({});

    const userKey = computed(() => resolveSearchHistoryUserKey(userStore.userInfo.user));
    const history = computed(() => historiesByUser.value[userKey.value] ?? []);

    const pushKeyword = (keyword: string) => {
      const key = userKey.value;
      historiesByUser.value = {
        ...historiesByUser.value,
        [key]: pushSearchHistoryKeyword(historiesByUser.value[key] ?? [], keyword),
      };
    };

    const clearHistory = () => {
      historiesByUser.value = clearSearchHistoryForUser(historiesByUser.value, userKey.value);
    };

    return {
      historiesByUser,
      history,
      pushKeyword,
      clearHistory,
    };
  },
  {
    persist: {
      storage: localStorage,
      pick: ["historiesByUser"],
    },
  },
);
