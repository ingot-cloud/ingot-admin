import { createPinia } from "pinia";
import type { Pinia } from "pinia";
import { createPersistedState } from "pinia-plugin-persistedstate";
import { getAdminRuntimeConfig } from "../runtime";

export const createAdminPinia = (): Pinia => {
  const pinia = createPinia();
  const persistPrefix = getAdminRuntimeConfig().storage.storePrefix;
  pinia.use(
    createPersistedState({
      key: (id) => `${persistPrefix}${id}`,
    }),
  );
  return pinia;
};
