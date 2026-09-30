// @vitest-environment jsdom
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia } from "pinia";
import { describe, expect, it, vi } from "vitest";
import BizIamAuthorizationSelect from "./BizIamAuthorizationSelect.vue";
import type { AuthorizationCandidatePage, AuthorizationCandidateQuery } from "../models/iam";
import type { R } from "@ingot/admin-core";
vi.mock("../hooks/iamEditorFailure", () => ({ iamEditorFailure: vi.fn() }));
const envelope = (id: string): R<AuthorizationCandidatePage> =>
  ({
    data: { items: [{ id, name: `成员 ${id}` }], total: 1, page: 1, pageSize: 20, supported: true },
  }) as R<AuthorizationCandidatePage>;
const stubs = {
  ElSelect: { template: "<div><slot /></div>" },
  ElOption: { props: ["label"], template: "<span>{{ label }}</span>" },
  ElAlert: true,
  InButton: true,
};
const global = () => ({ stubs, plugins: [createPinia()] });
describe("授权分页候选", () => {
  it("依据改变后丢弃迟到响应，不覆盖新候选", async () => {
    const pending: Array<(response: R<AuthorizationCandidatePage>) => void> = [];
    const api = vi.fn(
      () => new Promise<R<AuthorizationCandidatePage>>((resolve) => pending.push(resolve)),
    );
    const wrapper = mount(BizIamAuthorizationSelect, {
      props: { api, query: { kind: "MEMBER", delegationGrantId: "1" } },
      global: global(),
    });
    const vm = wrapper.vm as unknown as { search: (keyword: string) => void };
    vm.search("旧");
    await vi.waitFor(() => expect(pending).toHaveLength(1));
    await wrapper.setProps({ query: { kind: "MEMBER", delegationGrantId: "2" } });
    vm.search("新");
    await vi.waitFor(() => expect(pending).toHaveLength(2));
    pending[1](envelope("200"));
    await flushPromises();
    pending[0](envelope("100"));
    await flushPromises();
    expect(wrapper.text()).toContain("成员 200");
    expect(wrapper.text()).not.toContain("成员 100");
  });
  it("已选 ID 超过一页时分页回显，不全量拉取候选", async () => {
    const api = vi.fn(
      async (query: AuthorizationCandidateQuery) =>
        ({
          data: {
            items: (query.ids || []).map((id: string) => ({ id, name: id })),
            total: query.ids?.length || 0,
            page: 1,
            pageSize: 20,
            supported: true,
          },
        }) as R<AuthorizationCandidatePage>,
    );
    mount(BizIamAuthorizationSelect, {
      props: {
        api,
        query: { kind: "MEMBER" },
        multiple: true,
        modelValue: Array.from({ length: 45 }, (_, i) => String(i + 1)),
      },
      global: global(),
    });
    await flushPromises();
    expect(api).toHaveBeenCalledTimes(3);
    expect(api.mock.calls.every(([query]) => (query.ids?.length || 0) <= 20)).toBe(true);
  });
  it("依据变化后清理被服务端筛掉的已选对象，并通知表单使预览失效", async () => {
    const api = vi.fn(
      async (query: AuthorizationCandidateQuery) =>
        ({
          data: {
            items: (query.ids || [])
              .filter((id) => query.delegationGrantId === "1" || id === "2")
              .map((id) => ({ id, name: id })),
            total: 2,
            page: 1,
            pageSize: 20,
            supported: true,
          },
        }) as R<AuthorizationCandidatePage>,
    );
    const wrapper = mount(BizIamAuthorizationSelect, {
      props: {
        api,
        query: { kind: "MEMBER", delegationGrantId: "1" },
        multiple: true,
        modelValue: ["1", "2"],
      },
      global: global(),
    });
    await flushPromises();
    await wrapper.setProps({ query: { kind: "MEMBER", delegationGrantId: "2" } });
    await flushPromises();
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual([["2"]]);
    expect(wrapper.emitted("change")?.at(-1)).toEqual([[{ id: "2", name: "2" }]]);
  });
});
