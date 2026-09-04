import type { App } from "vue";

export async function installQueryDevtools(app: App): Promise<void> {
  if (!import.meta.env.DEV) {
    return;
  }
  const { VueQueryDevtools } = await import("@tanstack/vue-query-devtools");
  app.component("VueQueryDevtools", VueQueryDevtools);
}
