// @vitest-environment jsdom
import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import type { R } from "@ingot/admin-core";
import type { AuthorizationCandidatePage, AuthorizationCandidateQuery } from "../models/iam";
import BizIamTreeCandidateDialog from "./BizIamTreeCandidateDialog.vue";

describe("树形范围候选", () => {
  it("首屏复用候选，未加载的持久化已选 ID 不被首屏或确认截断", async () => {
    const api = vi.fn();
    const loadSelected = vi.fn(async () => ({
      data: {
        items: [{ id: "2", name: "已选第二项" }],
        total: 2,
        page: 1,
        pageSize: 20,
        supported: true,
      },
    }));
    const wrapper = mount(BizIamTreeCandidateDialog, {
      props: {
        api,
        loadSelected,
        query: { kind: "OBJECT" },
        title: "选择对象",
        searchPlaceholder: "搜索对象",
        multiple: true,
      },
      global: {
        stubs: {
          InDialog: {
            props: ["modelValue"],
            template: '<div v-if="modelValue"><slot /><slot name="footer" /></div>',
          },
          InButton: {
            emits: ["inClick"],
            template: "<button @click=\"$emit('inClick')\"><slot /></button>",
          },
          InIcon: true,
          ElInput: true,
          ElCheckbox: true,
        },
      },
    });
    (
      wrapper.vm as unknown as {
        show: (
          items: AuthorizationOption[],
          page: AuthorizationCandidatePage,
          ids: string[],
        ) => void;
      }
    ).show(
      [],
      {
        items: [{ id: "1", name: "第一页" }],
        total: 30,
        page: 1,
        pageSize: 20,
        supported: true,
        hierarchical: true,
      },
      ["2", "99"],
    );
    await flushPromises();
    expect(api).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("已选 2 项");
    await wrapper
      .findAll("button")
      .find((button) => button.text() === "确定")
      ?.trigger("click");
    expect(wrapper.emitted("confirm")?.at(-1)?.[0]).toEqual([
      { id: "2", name: "已选第二项" },
      { id: "99", name: "99", labelPending: true },
    ]);
  });

  it("受限子菜单的祖先只用于导航，展开后仅能选择允许的叶节点", async () => {
    const api = vi.fn(
      async (query: AuthorizationCandidateQuery) =>
        ({
          data: {
            items: query.parentId
              ? [{ id: "2", name: "成员", parentId: "1", selectable: true, hasChildren: false }]
              : [{ id: "1", name: "管理", selectable: false, hasChildren: true }],
            total: 1,
            page: 1,
            pageSize: 20,
            supported: true,
            hierarchical: true,
          },
        }) as R<AuthorizationCandidatePage>,
    );
    const wrapper = mount(BizIamTreeCandidateDialog, {
      props: {
        api,
        query: { kind: "OBJECT" },
        title: "选择菜单",
        searchPlaceholder: "搜索菜单",
        multiple: true,
      },
      global: {
        stubs: {
          InDialog: {
            props: ["modelValue"],
            template: '<div v-if="modelValue"><slot /><slot name="footer" /></div>',
          },
          InButton: {
            emits: ["inClick"],
            template: "<button @click=\"$emit('inClick')\"><slot /></button>",
          },
          InIcon: true,
          ElInput: true,
          ElCheckbox: {
            emits: ["change"],
            template: '<button class="selectable" @click="$emit(\'change\')"><slot /></button>',
          },
        },
      },
    });
    (wrapper.vm as unknown as { show: (items: never[]) => void }).show([]);
    await flushPromises();
    expect(wrapper.text()).toContain("管理（仅导航）");
    expect(wrapper.findAll(".selectable")).toHaveLength(0);
    await wrapper.find('button[aria-label="展开"]').trigger("click");
    await flushPromises();
    expect(api).toHaveBeenCalledWith(expect.objectContaining({ tree: true, parentId: "1" }));
    await wrapper.find(".selectable").trigger("click");
    await wrapper
      .findAll("button")
      .find((button) => button.text() === "确定")
      ?.trigger("click");
    expect(wrapper.emitted("confirm")?.at(-1)?.[0]).toEqual([
      expect.objectContaining({ id: "2", selectable: true }),
    ]);
  });
});
