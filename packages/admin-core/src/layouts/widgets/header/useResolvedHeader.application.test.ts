import { afterEach, describe, expect, it } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { defineComponent, h, type ComputedRef } from "vue";
import { createPinia, setActivePinia } from "pinia";
import { createRouter, createMemoryHistory } from "vue-router";
import { usePermissions } from "@/stores/modules/auth";
import { useRouterStore } from "@/stores/modules/router";
import { resetAdminRuntime } from "@/runtime";
import { useResolvedHeader } from "./useResolvedHeader";
import type { ResolvedHeaderConfig } from "./resolveHeaderConfig";

describe("应用顶栏与路由", () => {
  afterEach(resetAdminRuntime);
  it("初始深链接、选择应用和搜索导航同步侧栏上下文，不追加候选接口", async () => {
    const pinia = createPinia(); setActivePinia(pinia);
    const router = createRouter({ history: createMemoryHistory(), routes: [
      { path: "/one", component: { render: () => h("div") }, meta: { applicationId: "1" } },
      { path: "/two", component: { render: () => h("div") }, meta: { applicationId: "2" } },
    ] });
    const permissions = usePermissions();
    permissions.applications = [
      { id: "1", name: "应用一", code: "one", sortOrder: 1 },
      { id: "2", name: "应用二", code: "two", sortOrder: 2 },
    ];
    const store = useRouterStore();
    store.menus = [ { path: "/one", applicationId: "1" }, { path: "/two", applicationId: "2" } ];
    await router.push("/two"); await router.isReady();
    let header: ComputedRef<ResolvedHeaderConfig> | undefined;
    const wrapper = mount(defineComponent({ setup() {
      header = useResolvedHeader(() => ({ navigation: { source: "applications", maxVisibleItems: 2 } }), () => undefined);
      return () => h("div");
    } }), { global: { plugins: [pinia, router] } });
    expect(header?.value.navigation.activeKey).toBe("2");
    expect(header?.value.navigation.items.map(item => item.label)).toEqual(["应用一", "应用二"]);
    header?.value.navigation.onSelect?.({ entryKey: "1" }); await flushPromises();
    expect(router.currentRoute.value.path).toBe("/one");
    expect(store.activeApplicationId).toBe("1");
    await router.push("/two"); await flushPromises();
    expect(store.activeApplicationId).toBe("2");
    permissions.applications = permissions.applications.filter(app => app.id === "1"); await flushPromises();
    expect(header?.value.navigation.items.map(item => item.key)).toEqual(["1"]);
    expect(store.activeApplicationId).toBe("1");
    wrapper.unmount();
  });
});
