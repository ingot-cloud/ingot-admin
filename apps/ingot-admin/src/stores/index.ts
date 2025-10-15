import { createPinia } from "pinia";
import { createPersistedState } from "pinia-plugin-persistedstate";

const pinia = createPinia();
pinia.use(
  createPersistedState({
    key: (id) => `${import.meta.env.VITE_APP_STORE_PREFIX}${id}`,
  }),
);

export default pinia;
