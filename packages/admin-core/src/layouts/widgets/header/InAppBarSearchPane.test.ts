import { afterEach, describe, expect, it } from "vitest";
import { defineComponent, h, nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import InAppBarSearchPane from "./InAppBarSearchPane.vue";
import { useRouterStore } from "@/stores/modules/router";
import { useUserInfoStore } from "@/stores/modules/auth";

const Page = defineComponent({ render: () => h("div") });

describe("InAppBarSearchPane", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("紧凑模式点击图标打开浮层并展示同一搜索输入", async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: "/", component: Page }],
    });
    await router.push("/");
    await router.isReady();
    const pinia = createPinia();
    setActivePinia(pinia);
    useUserInfoStore().userInfo.user = { phone: "13800001111" };
    useRouterStore().menus = [{ path: "/org/dept", title: "部门" }];
    const wrapper = mount(InAppBarSearchPane, {
      props: {
        enabled: true,
        compact: true,
        placeholder: "搜索功能导航",
      },
      attachTo: document.body,
      global: {
        plugins: [pinia, router],
        stubs: {
          InIcon: true,
          ElTooltip: { template: "<span><slot /></span>" },
        },
      },
    });
    await wrapper.get("[aria-label='搜索']").trigger("click");
    await nextTick();
    expect(wrapper.get(".in-app-bar-overlay").classes()).toContain("is-open");
    expect(document.querySelector("[data-testid='app-bar-search-field']")).not.toBeNull();
    wrapper.unmount();
  });
});
