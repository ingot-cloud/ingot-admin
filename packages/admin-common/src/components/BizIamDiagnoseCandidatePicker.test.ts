// @vitest-environment jsdom
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { describe, expect, it, vi } from "vitest";
import type { R } from "@ingot/admin-core";
import type { AuthorizationCandidatePage } from "../models/iam";
import BizIamDiagnoseCandidatePicker from "./BizIamDiagnoseCandidatePicker.vue";

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
const global = () => ({ plugins: [createPinia()], stubs });

describe("诊断单选弹窗", () => {
  it("打开后查询候选，确认单选，并在上游条件变化时清除旧目标", async () => {
    const api = vi.fn(
      async () =>
        ({
          data: {
            items: [{ id: "42", name: "示例应用" }],
            total: 1,
            page: 1,
            pageSize: 20,
            supported: true,
          },
        }) as R<AuthorizationCandidatePage>,
    );
    const wrapper = mount(BizIamDiagnoseCandidatePicker, {
      props: { api, query: { kind: "APPLICATION" }, title: "选择应用", placeholder: "请选择应用" },
      global: global(),
    });
    await wrapper.find('button[aria-label="请选择应用"]').trigger("click");
    await flushPromises();
    expect(api).toHaveBeenCalledTimes(1);
    await wrapper.find('button[aria-pressed="false"]').trigger("click");
    await wrapper
      .findAll("button")
      .find((button) => button.text() === "确定")
      ?.trigger("click");
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual(["42"]);
    await wrapper.setProps({ query: { kind: "ACTION", applicationId: "99" } });
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual([""]);
  });

  it("同名操作展示所属资源，但确认后仍只输出一个操作 ID", async () => {
    const api = vi.fn(
      async () =>
        ({
          data: {
            items: [
              { id: "70", name: "创建", summary: "成员管理" },
              { id: "71", name: "创建", summary: "用户组管理" },
            ],
            total: 2,
            page: 1,
            pageSize: 20,
            supported: true,
          },
        }) as R<AuthorizationCandidatePage>,
    );
    const wrapper = mount(BizIamDiagnoseCandidatePicker, {
      props: {
        api,
        query: { kind: "ACTION", applicationId: "100" },
        title: "选择操作",
        placeholder: "请选择操作",
      },
      global: global(),
    });
    await wrapper.find('button[aria-label="请选择操作"]').trigger("click");
    await flushPromises();
    expect(wrapper.text()).toContain("成员管理 / 创建");
    expect(wrapper.text()).toContain("用户组管理 / 创建");
    await wrapper.findAll('button[aria-pressed="false"]')[1].trigger("click");
    await wrapper
      .findAll("button")
      .find((button) => button.text() === "确定")
      ?.trigger("click");
    expect(wrapper.find('button[aria-label="请选择操作"]').text()).toContain("用户组管理 / 创建");
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual(["71"]);
  });
});
