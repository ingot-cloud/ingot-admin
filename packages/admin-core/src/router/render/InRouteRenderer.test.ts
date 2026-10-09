import { describe, it, expect, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { defineComponent, h, ref, nextTick, onUnmounted } from "vue";
import { createRouter, createMemoryHistory, type RouteRecordRaw } from "vue-router";
import { createPinia, setActivePinia } from "pinia";
import InRouteRenderer from "./InRouteRenderer.vue";
import { useRouterStore } from "@/stores/modules/router";
import { usePermissions } from "@/stores/modules/auth";

let mounts = 0,
  destroys = 0;
const page = () =>
  defineComponent({
    name: "IndexPage",
    props: ["a", "b"],
    setup(props) {
      mounts++;
      const filter = ref("");
      onUnmounted(() => destroys++);
      return () =>
        h("div", [
          h("span", `${props.a ?? ""}/${props.b ?? ""}`),
          h("input", {
            value: filter.value,
            onInput: (event: Event) => {
              filter.value = (event.target as HTMLInputElement).value;
            },
          }),
        ]);
    },
  });
const Layout = defineComponent({ setup: () => () => h(InRouteRenderer) });
async function fixture(routes: RouteRecordRaw[], path: string) {
  const router = createRouter({ history: createMemoryHistory(), routes });
  await router.push(path);
  await router.isReady();
  const wrapper = mount(InRouteRenderer, { global: { plugins: [router] } });
  await flushPromises();
  const go = async (to: string) => {
    await router.push(to);
    await flushPromises();
    await nextTick();
  };
  return { wrapper, go };
}
beforeEach(() => {
  setActivePinia(createPinia());
  mounts = 0;
  destroys = 0;
});
describe("route page caching", () => {
  it("透传路径参数，参数组合独立缓存，query/hash复用实例，同名组件隔离", async () => {
    const Page = page();
    const { wrapper, go } = await fixture(
      [
        {
          path: "/orders/:a/:b",
          name: "orders",
          component: Page,
          props: true,
          meta: { isCache: true },
        },
        { path: "/other", name: "other", component: page(), meta: { isCache: true } },
        { path: "/plain", name: "plain", component: page() },
      ],
      "/orders/1001/normal",
    );
    expect(wrapper.text()).toContain("1001/normal");
    await wrapper.get("input").setValue("first");
    await go("/orders/1002/normal");
    expect(wrapper.get("input").element.value).toBe("");
    await wrapper.get("input").setValue("second");
    await go("/orders/1001/normal?tab=2#x");
    expect(wrapper.get("input").element.value).toBe("first");
    expect(mounts).toBe(2);
    await go("/other");
    expect(wrapper.get("input").element.value).toBe("");
    await go("/plain");
    await wrapper.get("input").setValue("destroy");
    await go("/other");
    await go("/plain");
    expect(wrapper.get("input").element.value).toBe("");
    expect(destroys).toBe(1);
    wrapper.unmount();
  });
  it("嵌套目录与跨目录返回保留子页状态", async () => {
    const { wrapper, go } = await fixture(
      [
        {
          path: "/one",
          component: Layout,
          name: "dir1",
          meta: { menuKind: "DIRECTORY" },
          children: [
            { path: "a", name: "a", component: page(), meta: { isCache: true } },
            { path: "b", name: "b", component: page(), meta: { isCache: true } },
          ],
        },
        {
          path: "/two",
          component: Layout,
          name: "dir2",
          meta: { menuKind: "DIRECTORY" },
          children: [{ path: "a", name: "c", component: page(), meta: { isCache: true } }],
        },
      ],
      "/one/a",
    );
    await wrapper.get("input").setValue("nested");
    await go("/one/b");
    await go("/two/a");
    await go("/one/a");
    expect(wrapper.get("input").element.value).toBe("nested");
    expect(mounts).toBe(3);
    wrapper.unmount();
  });
  it("LRU只保留20个实例，授权和配置变化销毁缓存", async () => {
    const { wrapper, go } = await fixture(
      [{ path: "/item/:a", name: "item", component: page(), props: true, meta: { isCache: true } }],
      "/item/0",
    );
    await wrapper.get("input").setValue("old");
    for (let i = 1; i <= 20; i++) await go(`/item/${i}`);
    expect(destroys).toBe(1);
    await go("/item/0");
    expect(wrapper.get("input").element.value).toBe("");
    await wrapper.get("input").setValue("reset");
    useRouterStore().cacheEpoch++;
    await nextTick();
    await flushPromises();
    expect(wrapper.get("input").element.value).toBe("reset");
    await go("/item/1");
    await go("/item/0");
    expect(wrapper.get("input").element.value).toBe("");
    await wrapper.get("input").setValue("reset again");
    usePermissions().bumpContextEpoch();
    await nextTick();
    await flushPromises();
    expect(wrapper.get("input").element.value).toBe("");
    wrapper.unmount();
  });
});
