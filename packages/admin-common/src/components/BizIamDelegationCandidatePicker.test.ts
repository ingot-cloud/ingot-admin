// @vitest-environment jsdom
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { defineComponent, h } from "vue";
import { describe, expect, it, vi } from "vitest";
import { usePermissions, type R } from "@ingot/admin-core";
import { organizationMemberPickerKey } from "./organizationMemberPicker";
import type { AuthorizationCandidatePage, AuthorizationCandidateQuery } from "../models/iam";
import BizIamDelegationCandidatePicker from "./BizIamDelegationCandidatePicker.vue";

vi.mock("../hooks/iamEditorFailure", () => ({ iamEditorFailure: vi.fn() }));
const stubs = {
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
  ElAlert: true,
  ElPagination: true,
};

describe("委派实体候选", () => {
  it.each([false, true])(
    "外部属性仅作用于录入框，模型更新不产生继承警告（多选=%s）",
    async (multiple) => {
      const warnings: string[] = [];
      const api = vi.fn();
      const wrapper = mount(BizIamDelegationCandidatePicker, {
        attrs: {
          class: "w-320px max-w-full",
          style: "max-width: 320px",
          "data-testid": "scope-input",
        },
        props: {
          api,
          query: { kind: "OBJECT", actionId: "10" },
          title: "选择范围对象",
          placeholder: "请选择对象",
          searchPlaceholder: "搜索对象",
          modelValue: multiple ? ["1"] : "1",
          selectedOptions: [{ id: "1", name: "应用一" }],
          multiple,
        },
        global: {
          plugins: [createPinia()],
          config: { warnHandler: (message) => warnings.push(message) },
          stubs: {
            ...stubs,
            BizIamMemberPickerDialog: true,
            BizIamTreeCandidateDialog: true,
          },
        },
      });
      await flushPromises();
      await wrapper.setProps({
        modelValue: multiple ? ["2"] : "2",
        selectedOptions: [{ id: "2", name: "应用二" }],
      });
      await flushPromises();
      expect(
        warnings.filter((message) => message.includes("Extraneous non-props attributes")),
      ).toEqual([]);
      const field = wrapper.get('[data-testid="scope-input"]');
      expect(field.classes()).toEqual(expect.arrayContaining(["flex", "w-320px", "max-w-full"]));
      expect(field.attributes("style")).toContain("max-width: 320px");
      expect(field.text()).toContain("应用二");
      expect(wrapper.findAll('[data-testid="scope-input"]')).toHaveLength(1);
      expect(api).not.toHaveBeenCalled();
      wrapper.unmount();
    },
  );

  it("已有对象摘要从草稿回显，树形第一页直接复用，每次打开只请求一页", async () => {
    const show = vi.fn();
    const loadSelected = vi.fn();
    const api = vi.fn(async () => ({
      data: {
        items: [{ id: "2", name: "候选" }],
        total: 40,
        page: 1,
        pageSize: 20,
        supported: true,
        hierarchical: true,
      },
    }));
    const wrapper = mount(BizIamDelegationCandidatePicker, {
      props: {
        api,
        query: { kind: "OBJECT", actionId: "10" },
        title: "选择对象",
        placeholder: "请选择对象",
        searchPlaceholder: "搜索对象",
        modelValue: ["99"],
        loadSelected,
        selectedOptions: [{ id: "99", name: "第九十九项", ancestorPath: "根 / 第九十九项" }],
        multiple: true,
      },
      global: {
        plugins: [createPinia()],
        stubs: {
          ...stubs,
          BizIamTreeCandidateDialog: defineComponent({
            setup(_props, { expose }) {
              expose({ show, hide: vi.fn() });
              return () => h("div");
            },
          }),
        },
      },
    });
    await flushPromises();
    expect(api).not.toHaveBeenCalled();
    expect(loadSelected).not.toHaveBeenCalled();
    for (let count = 1; count <= 2; count++) {
      await wrapper.find('[role="button"][aria-label="请选择对象"]').trigger("click");
      await flushPromises();
      expect(api).toHaveBeenCalledTimes(count);
      expect(show).toHaveBeenLastCalledWith(
        [expect.objectContaining({ id: "99", name: "第九十九项" })],
        expect.objectContaining({ hierarchical: true }),
        undefined,
      );
    }
  });

  it("编辑时按当前委派候选回显名称，单选确认仅提交 ID", async () => {
    const api = vi.fn(
      async (query: AuthorizationCandidateQuery) =>
        ({
          data: {
            items: query.ids ? [{ id: "1", name: "张三" }] : [{ id: "2", name: "李四" }],
            total: 1,
            page: 1,
            pageSize: 20,
            supported: true,
          },
        }) as R<AuthorizationCandidatePage>,
    );
    const wrapper = mount(BizIamDelegationCandidatePicker, {
      props: {
        api,
        query: { kind: "MEMBER" },
        title: "选择授权管理员",
        placeholder: "请选择授权管理员",
        searchPlaceholder: "搜索管理员姓名",
        modelValue: "1",
      },
      global: { plugins: [createPinia()], stubs },
    });
    await flushPromises();
    expect(wrapper.find('[role="button"][aria-label="请选择授权管理员"]').text()).toContain("张三");
    expect(wrapper.emitted("selection")?.at(-1)).toEqual([[{ id: "1", name: "张三" }]]);
    expect(wrapper.emitted("confirm")).toBeUndefined();
    await wrapper.find('[role="button"][aria-label="请选择授权管理员"]').trigger("click");
    await flushPromises();
    await wrapper.find('button[aria-pressed="false"]').trigger("click");
    await wrapper
      .findAll("button")
      .find((item) => item.text() === "确定")
      ?.trigger("click");
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual(["2"]);
    expect(wrapper.emitted("selection")?.at(-1)).toEqual([[{ id: "2", name: "李四" }]]);
    expect(wrapper.emitted("confirm")?.at(-1)).toEqual([[{ id: "2", name: "李四" }]]);
    expect(api.mock.calls.some(([query]) => query.page === 1 && query.pageSize === 20)).toBe(true);
  });

  it("同一上下文已选内容不重复回显，上下文变化时重新校验", async () => {
    const show = vi.fn();
    let eligible = true;
    const api = vi.fn(
      async (query: AuthorizationCandidateQuery) =>
        ({
          data: {
            items: query.ids
              ? eligible
                ? [{ id: "1", name: "张三" }]
                : []
              : [{ id: "2", name: "李四" }],
            total: query.ids ? (eligible ? 1 : 0) : 1,
            page: 1,
            pageSize: 20,
            supported: true,
          },
        }) as R<AuthorizationCandidatePage>,
    );
    const wrapper = mount(BizIamDelegationCandidatePicker, {
      props: {
        api,
        query: { kind: "MEMBER" },
        title: "选择允许接收的成员",
        placeholder: "请选择允许接收的成员",
        searchPlaceholder: "搜索成员姓名",
        modelValue: ["1"],
        selectedOptions: [{ id: "1", name: "张三" }],
        multiple: true,
      },
      global: {
        plugins: [createPinia()],
        stubs: {
          ...stubs,
          BizIamMemberPickerDialog: defineComponent({
            setup(_props, { expose }) {
              expose({ show, hide: vi.fn() });
              return () => h("div");
            },
          }),
        },
      },
    });
    await flushPromises();
    expect(wrapper.text()).toContain("张三");
    eligible = false;
    await wrapper.setProps({ query: { kind: "MEMBER", excludeMemberId: "3" } });
    await flushPromises();
    await wrapper.find('[role="button"][aria-label="请选择允许接收的成员"]').trigger("click");
    await flushPromises();
    expect(show).toHaveBeenCalledWith([], undefined);
  });
});

describe("租户组织成员候选边界", () => {
  const create = (api: ReturnType<typeof vi.fn>, ids: string[]) => {
    const show = vi.fn(),
      hide = vi.fn();
    const pinia = createPinia();
    const wrapper = mount(BizIamDelegationCandidatePicker, {
      props: {
        api,
        query: { kind: "MEMBER" },
        multiple: true,
        modelValue: ids,
        title: "选择成员",
        placeholder: "请选择成员",
        searchPlaceholder: "搜索姓名",
      },
      global: {
        plugins: [pinia],
        provide: { [organizationMemberPickerKey as symbol]: { loadDepartments: vi.fn() } },
        stubs: {
          ...stubs,
          BizIamMemberPickerDialog: defineComponent({
            setup(_, { expose }) {
              expose({ show, hide });
              return () => h("div");
            },
          }),
          BizIamTreeCandidateDialog: defineComponent({
            setup(_, { expose }) {
              expose({ hide });
              return () => h("div");
            },
          }),
        },
      },
    });
    return { wrapper, show, pinia };
  };
  it("大量旧选择只补首屏姓名，确认前不丢弃未加载ID", async () => {
    const api = vi.fn().mockResolvedValue({
      data: {
        supported: true,
        items: [{ id: "1", name: "甲" }],
        total: 1,
        page: 1,
        pageSize: 20,
      },
    });
    const ids = Array.from({ length: 45 }, (_, i) => String(i + 1));
    const { wrapper, show } = create(api, ids);
    await flushPromises();
    expect(api).toHaveBeenCalledTimes(1);
    expect(api.mock.calls[0]![0].ids).toHaveLength(20);
    await wrapper.get('[role="button"][aria-label="请选择成员"]').trigger("click");
    await flushPromises();
    const selected = show.mock.calls[0]![0] as Array<{ id: string }>;
    expect(selected.map((item) => item.id)).toEqual(ids);
    expect(api.mock.calls.every((call) => call[0].ids.length <= 20)).toBe(true);
    wrapper.unmount();
  });
  it.each(["epoch", "version"])(
    "权限变化（%s）使未完成的名称回显失效，不再打开旧弹窗",
    async (mode) => {
      let finish: ((value: unknown) => void) | undefined;
      const pending = new Promise((resolve) => {
        finish = resolve;
      });
      const api = vi.fn().mockReturnValue(pending);
      const { wrapper, show, pinia } = create(api, ["1"]);
      await wrapper.get('[role="button"][aria-label="请选择成员"]').trigger("click");
      if (mode === "epoch") usePermissions(pinia).bumpContextEpoch();
      else usePermissions(pinia).version = "v2";
      await flushPromises();
      finish!({
        data: {
          supported: true,
          items: [{ id: "1", name: "旧范围" }],
          total: 1,
          page: 1,
          pageSize: 20,
        },
      });
      await flushPromises();
      expect(show).not.toHaveBeenCalled();
      wrapper.unmount();
    },
  );
});
