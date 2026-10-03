// @vitest-environment jsdom
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { describe, expect, it, vi } from "vitest";
import type { R } from "@ingot/admin-core";
import type {
  AuthorizationCandidatePage,
  AuthorizationRoleCandidateQuery,
  AuthorizationRoleNode,
  IamPageResponse,
} from "../models/iam";
import BizIamDelegationRolePicker from "./BizIamDelegationRolePicker.vue";

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
  InCloseButton: { emits: ["click"], template: "<button @click=\"$emit('click')\">移除</button>" },
  ElInput: true,
  ElCheckbox: {
    props: ["modelValue"],
    emits: ["change"],
    template: '<input type="checkbox" :checked="modelValue" @change="$emit(\'change\')" />',
  },
  ElPagination: true,
};
const role = {
  id: "40",
  roleId: "40",
  roleName: "平台治理",
  name: "平台治理",
  nodeType: "ROLE",
} as AuthorizationRoleNode;
const version = {
  id: "50",
  roleId: "40",
  roleName: "平台治理",
  name: "v2",
  nodeType: "REVISION",
  revisionNumber: 2,
  roleRevisionRef: { kind: "PLATFORM_CUSTOM", id: "50" },
} as AuthorizationRoleNode;

describe("委派角色版本多选", () => {
  it("所选角色不在第一页时仍独立回显，确认已加载版本不重复查询详情", async () => {
    const selected = {
      id: "999",
      name: "另一角色 · v3",
      roleRevisionRef: { kind: "PLATFORM_CUSTOM", id: "999" },
      actions: [],
      grants: [],
    };
    const treeApi = vi.fn(async () => ({
      data: { items: [role], total: 40, page: 1, pageSize: 20 },
    }));
    const detailApi = vi.fn();
    const wrapper = mount(BizIamDelegationRolePicker, {
      props: { treeApi, detailApi, resetKey: 1, modelValue: [selected] },
      global: { plugins: [createPinia()], stubs },
    });
    await wrapper.find('button[aria-label="请选择允许分配的角色版本"]').trigger("click");
    await flushPromises();
    expect(treeApi).toHaveBeenCalledOnce();
    expect(wrapper.text()).toContain("另一角色 · v3");
    await wrapper
      .findAll("button")
      .find((item) => item.text() === "确定")
      ?.trigger("click");
    await flushPromises();
    expect(detailApi).not.toHaveBeenCalled();
    expect(wrapper.emitted("update:modelValue")?.at(-1)?.[0]).toEqual([selected]);
  });

  it("只在确认时写入所选固定版本，取消保留原草稿", async () => {
    const treeApi = vi.fn(
      async (query: AuthorizationRoleCandidateQuery) =>
        ({
          data: {
            items: query.roleId ? [version] : [role],
            total: 1,
            page: 1,
            pageSize: 20,
          },
        }) as R<IamPageResponse<AuthorizationRoleNode>>,
    );
    const detailApi = vi.fn(
      async () =>
        ({
          data: {
            items: [
              {
                id: "50",
                name: "平台治理 · v2",
                roleRevisionRef: version.roleRevisionRef,
                actions: [],
              },
            ],
            total: 1,
            page: 1,
            pageSize: 20,
            supported: true,
          },
        }) as R<AuthorizationCandidatePage>,
    );
    const wrapper = mount(BizIamDelegationRolePicker, {
      props: { treeApi, detailApi, resetKey: 1 },
      global: { plugins: [createPinia()], stubs },
    });
    await wrapper.find('button[aria-label="请选择允许分配的角色版本"]').trigger("click");
    await flushPromises();
    await wrapper.find('[role="treeitem"] > button').trigger("click");
    await vi.waitFor(() => expect(wrapper.find('input[type="checkbox"]').exists()).toBe(true));
    await wrapper.find('input[type="checkbox"]').trigger("change");
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
    await wrapper
      .findAll("button")
      .find((item) => item.text() === "取消")
      ?.trigger("click");
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
    await wrapper.find('button[aria-label="请选择允许分配的角色版本"]').trigger("click");
    await flushPromises();
    await wrapper.find('[role="treeitem"] > button').trigger("click");
    await vi.waitFor(() => expect(wrapper.find('input[type="checkbox"]').exists()).toBe(true));
    await wrapper.find('input[type="checkbox"]').trigger("change");
    await wrapper
      .findAll("button")
      .find((item) => item.text() === "确定")
      ?.trigger("click");
    await flushPromises();
    expect(detailApi).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "ROLE_REVISION", ids: ["50"] }),
    );
    expect(wrapper.emitted("update:modelValue")?.at(-1)?.[0]).toEqual([
      expect.objectContaining({ id: "50", name: "平台治理 · v2" }),
    ]);
  });

  it("确认请求尚未返回时关闭弹窗不会写入过期选择", async () => {
    const treeApi = vi.fn(
      async (query: AuthorizationRoleCandidateQuery) =>
        ({
          data: { items: query.roleId ? [version] : [role], total: 1, page: 1, pageSize: 20 },
        }) as R<IamPageResponse<AuthorizationRoleNode>>,
    );
    let resolveDetail!: (value: R<AuthorizationCandidatePage>) => void;
    const detailApi = vi.fn(
      () =>
        new Promise<R<AuthorizationCandidatePage>>((resolve) => {
          resolveDetail = resolve;
        }),
    );
    const wrapper = mount(BizIamDelegationRolePicker, {
      props: { treeApi, detailApi, resetKey: 1 },
      global: { plugins: [createPinia()], stubs },
    });
    await wrapper.find('button[aria-label="请选择允许分配的角色版本"]').trigger("click");
    await flushPromises();
    await wrapper.find('[role="treeitem"] > button').trigger("click");
    await vi.waitFor(() => expect(wrapper.find('input[type="checkbox"]').exists()).toBe(true));
    await wrapper.find('input[type="checkbox"]').trigger("change");
    await wrapper
      .findAll("button")
      .find((item) => item.text() === "确定")
      ?.trigger("click");
    expect(detailApi).toHaveBeenCalledOnce();
    await wrapper
      .findAll("button")
      .find((item) => item.text() === "取消")
      ?.trigger("click");
    resolveDetail({
      data: {
        items: [{ id: "50", name: "平台治理 · v2", roleRevisionRef: version.roleRevisionRef }],
        total: 1,
        page: 1,
        pageSize: 20,
        supported: true,
      },
    } as R<AuthorizationCandidatePage>);
    await flushPromises();
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
  });
});
