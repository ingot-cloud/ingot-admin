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
import { allocateHeaderOverflow } from "./allocateHeaderOverflow";

describe("应用顶栏与路由", () => {
  afterEach(resetAdminRuntime);
  it("初始深链接、选择应用和搜索导航同步侧栏上下文，不追加候选接口", async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: "/one", component: { render: () => h("div") }, meta: { applicationId: "1" } },
        { path: "/two", component: { render: () => h("div") }, meta: { applicationId: "2" } },
      ],
    });
    const permissions = usePermissions();
    permissions.applications = [
      { id: "1", name: "应用一", code: "one", sortOrder: 1 },
      { id: "2", name: "应用二", code: "two", sortOrder: 2 },
    ];
    const store = useRouterStore();
    store.menus = [
      { path: "/one", applicationId: "1" },
      { path: "/two", applicationId: "2" },
    ];
    await router.push("/two");
    await router.isReady();
    let header: ComputedRef<ResolvedHeaderConfig> | undefined;
    const wrapper = mount(
      defineComponent({
        setup() {
          header = useResolvedHeader(
            () => ({ navigation: { source: "applications", maxVisibleItems: 2 } }),
            () => undefined,
          );
          return () => h("div");
        },
      }),
      { global: { plugins: [pinia, router] } },
    );
    expect(header?.value.navigation.activeKey).toBe("2");
    expect(header?.value.navigation.items.map((item) => item.label)).toEqual(["应用一", "应用二"]);
    header?.value.navigation.onSelect?.({ entryKey: "1" });
    await flushPromises();
    expect(router.currentRoute.value.path).toBe("/one");
    expect(store.activeApplicationId).toBe("1");
    await router.push("/two");
    await flushPromises();
    expect(store.activeApplicationId).toBe("2");
    permissions.applications = permissions.applications.filter((app) => app.id === "1");
    await flushPromises();
    expect(header?.value.navigation.items.map((item) => item.key)).toEqual(["1"]);
    expect(store.activeApplicationId).toBe("1");
    wrapper.unmount();
  });

  it("溢出应用切换成功后晋升直出，导航被阻止时不提前切换应用上下文", async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const router = createRouter({
      history: createMemoryHistory(),
      routes: ["a", "b", "c"].map((id) => ({
        path: `/${id}`,
        component: { render: () => h("div") },
        meta: { applicationId: id },
      })),
    });
    usePermissions().applications = ["a", "b", "c"].map((id, sortOrder) => ({
      id,
      code: id,
      name: `应用 ${id}`,
      sortOrder,
    }));
    const store = useRouterStore();
    store.menus = ["a", "b", "c"].map((id) => ({ path: `/${id}`, applicationId: id }));
    await router.push("/a");
    await router.isReady();
    let header: ComputedRef<ResolvedHeaderConfig> | undefined;
    const wrapper = mount(
      defineComponent({
        setup() {
          header = useResolvedHeader(
            () => ({
              navigation: {
                source: "applications",
                applicationGroups: [
                  { key: "office", title: "办公应用", applicationCodes: ["b", "c"] },
                ],
              },
            }),
            () => undefined,
          );
          return () => h("div");
        },
      }),
      { global: { plugins: [pinia, router] } },
    );
    try {
      expect(header?.value.navigation.maxVisibleItems).toBe(2);
      expect(
        header?.value.navigation.applicationGroups?.[0]?.items.map((item) => item.key),
      ).toEqual(["b", "c"]);
      const removeGuard = router.beforeEach((to) => to.path !== "/c");
      header?.value.navigation.onSelect?.({ entryKey: "c" });
      await flushPromises();
      expect(store.activeApplicationId).toBe("a");
      expect(router.currentRoute.value.path).toBe("/a");
      removeGuard();
      header?.value.navigation.onSelect?.({ entryKey: "c" });
      await flushPromises();
      expect(store.activeApplicationId).toBe("c");
      const packed = allocateHeaderOverflow({
        availableWidth: 1200,
        navItems: header!.value.navigation.items.map((item) => ({ key: item.key, width: 80 })),
        activeNavKey: header?.value.navigation.activeKey,
        maxVisibleNavItems: header?.value.navigation.maxVisibleItems,
        navSlotWidth: 0,
        searchEnabled: false,
        searchFullWidth: 240,
        searchCompactWidth: 32,
        utilityItems: [],
        utilitySlotWidth: 0,
        moreButtonWidth: 32,
        itemGap: 12,
        zoneGap: 12,
        integratedNavMore: true,
        integratedNavMoreWidth: 24,
      });
      expect(packed.visibleNavKeys).toEqual(["a", "c"]);
      expect(packed.overflowNavKeys).toEqual(["b"]);
      await router.push("/b");
      await flushPromises();
      expect(store.activeApplicationId).toBe("b");
    } finally {
      wrapper.unmount();
    }
  });
});
