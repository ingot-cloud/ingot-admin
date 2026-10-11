// @vitest-environment jsdom
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia } from "pinia";
import { describe, expect, it, vi } from "vitest";
import { RoleKind } from "../models/iam";
import BizIamRoleApplicationDrawer from "./BizIamRoleApplicationDrawer.vue";
const dialogs = vi.hoisted(() => ({ warning: vi.fn(async () => {}) }));
vi.mock("@ingot/admin-core", async (actual) => ({ ...(await actual<object>()), Confirm: dialogs }));
const stubs = {
  InDrawer: {
    props: ["modelValue"],
    template: '<div v-if="modelValue"><slot/><slot name="footer"/></div>',
  },
  InDialog: true,
  InForm: { template: "<div><slot/></div>" },
  InButton: {
    props: ["disabled"],
    emits: ["inClick"],
    template: '<button :disabled="disabled" @click="$emit(\'inClick\')"><slot/></button>',
  },
  InTable: true,
  InTag: true,
  ElAlert: { props: ["title"], template: "<div>{{title}}</div>" },
  ElFormItem: { template: "<div><slot/></div>" },
  ElRadioGroup: true,
  BizIamWizardNav: true,
};
function fixture(status: "READY" | "BLOCKED" | "PAUSED" = "READY") {
  const task = {
    id: "50",
    roleId: "24",
    targetRevisionId: "35",
    version: "2",
    status,
    counts: {
      PENDING: 205,
      BLOCKED: status === "BLOCKED" ? 1 : 0,
      SUCCEEDED: status === "PAUSED" ? 100 : 0,
    },
    createdAt: "2026-10-10T00:00:00Z",
    updatedAt: "2026-10-10T00:00:00Z",
  };
  const api = {
    target: vi.fn(async () => ({
      id: "35",
      name: "v2 · 新版",
      roleRevisionRef: { kind: RoleKind.PLATFORM_CUSTOM, id: "35" },
      grants: [],
      actions: [],
      parameterDefinitions: [],
    })),
    prepare: vi.fn(async () => ({ data: task })),
    items: vi.fn(async () => ({ data: { current: 1, size: 20, records: [], total: 205 } })),
    get: vi.fn(async () => ({ data: task })),
    confirm: vi.fn(async () => ({ data: { ...task, status: "RUNNING" } })),
    refresh: vi.fn(async () => ({ data: { ...task, status: "READY", version: "3" } })),
    candidates: vi.fn(),
    distribution: vi.fn(),
    publish: vi.fn(),
    configure: vi.fn(),
    scopeCandidates: vi.fn(),
  };
  return { api, task, listRevisionsApi: vi.fn() };
}
async function click(wrapper: ReturnType<typeof mount>, name: string) {
  await wrapper
    .findAll("button")
    .find((b) => b.text() === name)!
    .trigger("click");
  await flushPromises();
}
describe("持久版本应用向导", () => {
  it("预检冲突禁止执行，处理大量记录时只请求分页明细", async () => {
    const f = fixture("BLOCKED");
    const wrapper = mount(BizIamRoleApplicationDrawer, {
      props: f,
      global: { plugins: [createPinia()], stubs },
    });
    await wrapper.vm.show("24", "35");
    await click(wrapper, "建立快照并配置范围");
    expect(f.api.prepare).toHaveBeenCalledWith(
      "24",
      expect.objectContaining({ targetRevisionId: "35", selection: "ALL" }),
    );
    expect(f.api.items).toHaveBeenCalledWith(
      "24",
      "50",
      expect.objectContaining({ current: 1, size: 20 }),
    );
    await click(wrapper, "预览影响");
    expect(
      wrapper
        .findAll("button")
        .find((b) => b.text() === "确认执行")!
        .attributes("disabled"),
    ).toBeDefined();
    expect(f.api.confirm).not.toHaveBeenCalled();
    wrapper.unmount();
  });
  it("执行只提交当前计划版本及幂等键，暂停后明确重新预检", async () => {
    const f = fixture();
    const wrapper = mount(BizIamRoleApplicationDrawer, {
      props: f,
      global: { plugins: [createPinia()], stubs },
    });
    await wrapper.vm.show("24", "35");
    await click(wrapper, "建立快照并配置范围");
    await click(wrapper, "预览影响");
    await click(wrapper, "确认执行");
    expect(f.api.confirm).toHaveBeenCalledWith("24", "50", {
      expectedVersion: "2",
      idempotencyKey: expect.any(String),
    });
    expect(wrapper.text()).not.toContain("全部纳入的分配已完成");
    wrapper.unmount();
    const paused = fixture("PAUSED");
    const next = mount(BizIamRoleApplicationDrawer, {
      props: paused,
      global: { plugins: [createPinia()], stubs },
    });
    await next.vm.show("24", "35", paused.task);
    await click(next, "继续处理");
    expect(paused.api.refresh).toHaveBeenCalledWith("24", "50", { expectedVersion: "2" });
    expect(paused.api.confirm).not.toHaveBeenCalled();
    next.unmount();
  });
  it("确认框期间换到其他角色不会应用到新的任务", async () => {
    let release: () => void = () => {};
    dialogs.warning.mockImplementationOnce(
      () =>
        new Promise<void>((r) => {
          release = r;
        }),
    );
    const f = fixture();
    const wrapper = mount(BizIamRoleApplicationDrawer, {
      props: f,
      global: { plugins: [createPinia()], stubs },
    });
    await wrapper.vm.show("24", "35");
    await click(wrapper, "建立快照并配置范围");
    await click(wrapper, "预览影响");
    await wrapper
      .findAll("button")
      .find((b) => b.text() === "确认执行")!
      .trigger("click");
    await wrapper.vm.show("25", "36");
    release();
    await flushPromises();
    expect(f.api.confirm).not.toHaveBeenCalled();
    wrapper.unmount();
  });
});
