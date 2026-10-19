import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DeptDetailDrawer from "./DeptDetailDrawer.vue";
const state = vi.hoisted(() => ({ get: vi.fn(), edit: vi.fn(), profile: true }));
vi.mock("@/api/iam/directory", () => ({
  TenantDepartmentDetailAPI: state.get,
  TenantDepartmentEditAPI: state.edit,
  TenantDepartmentPageAPI: vi.fn(),
  TenantDepartmentDeleteAPI: vi.fn(),
}));
vi.mock("@ingot/admin-core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@ingot/admin-core")>();
  const { ref } = await import("vue");
  return {
    ...actual,
    Confirm: { error: vi.fn() },
    Message: { success: vi.fn(), warning: vi.fn() },
    useCapabilities: () => ({
      hasAction: () => true,
      contextEpoch: ref(0),
      version: ref("v1"),
      unavailable: ref(false),
      actionCodes: ref([]),
    }),
    useDetailEditSession: () => {
      const editing = ref(false),
        saving = ref(false);
      return {
        editing,
        saving,
        enterEdit: () => {
          editing.value = true;
        },
        exitEdit: () => {
          editing.value = false;
        },
      };
    },
  };
});
vi.mock("./DepartmentLeaderField.vue", async () => {
  const { defineComponent } = await import("vue");
  return {
    default: defineComponent({
      name: "LeaderFieldStub",
      props: ["editing", "initialPage", "canRead"],
      emits: ["change"],
      template: "<div data-leaders />",
    }),
  };
});
const form = { template: "<div><slot/></div>" };
const drawer = defineComponent({
  props: ["modelValue", "editing", "tabs", "editable"],
  emits: ["edit", "save", "cancel"],
  template:
    '<div v-if="modelValue" :data-tabs="tabs"><slot name="identity"/><slot/><button @click="$emit(\'edit\')">编辑</button><button @click="$emit(\'save\')">保存</button></div>',
});
const input = defineComponent({
  props: ["modelValue"],
  emits: ["update:modelValue"],
  template:
    '<input :value="modelValue" @input="$emit(\'update:modelValue\',$event.target.value)"/>',
});
const record = {
  id: "11",
  parentId: "1",
  name: "研发",
  sortOrder: 1,
  navigationOnly: false,
  parentDepartment: { id: "1", name: "测试组织" },
  leaderPage: {
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
    departmentVersion: "4",
    restricted: false,
  },
};
const response = () => ({
  data: {
    record,
    version: "4",
    fieldAccess: {},
    capabilities: {
      "iam-tenant:department:read": { allowed: true },
      "iam-tenant:department:update": { allowed: state.profile },
      "iam-tenant:department:leaders": { allowed: true },
    },
  },
});
const create = () =>
  mount(DeptDetailDrawer, {
    global: {
      stubs: {
        InDetailDrawer: drawer,
        InDetailIdentity: {
          props: ["name"],
          template: '<div><slot name="avatar"/><span>{{name}}</span></div>',
        },
        InForm: form,
        InDetailField: {
          props: ["label", "value"],
          template: '<div :data-field="label"><span data-value>{{value}}</span><slot/></div>',
        },
        MemberDepartmentField: {
          name: "DepartmentFieldStub",
          props: ["modelValue", "multiple", "excludeDepartmentId"],
          emits: ["update:modelValue"],
          template: "<button data-parent-picker>选上级</button>",
        },
        ElFormItem: form,
        InPageSelect: true,
        ElInput: input,
        ElInputNumber: true,
        ElDropdown: true,
        ElAlert: { props: ["title"], template: "<div>{{title}}</div>" },
      },
    },
  });
beforeEach(() => {
  vi.clearAllMocks();
  state.profile = true;
  state.get.mockImplementation(async () => response());
  state.edit.mockImplementation(async () => ({
    ...response(),
    data: { ...response().data, version: "5" },
  }));
});
const open = async () => {
  const wrapper = create();
  wrapper.vm.show({ id: "11" });
  await flushPromises();
  await wrapper
    .findAll("button")
    .find((item) => item.text() === "编辑")!
    .trigger("click");
  return wrapper;
};
describe("部门统一编辑", () => {
  it("详情聚合传递负责人首屏，上级展示名称并通过单选部门对话框回填ID", async () => {
    const wrapper = await open();
    expect(state.get).toHaveBeenCalledExactlyOnceWith("11");
    expect(wrapper.get('[data-field="上级部门"] [data-value]').text()).toBe("测试组织");
    expect(wrapper.findComponent({ name: "DepartmentMark" }).props("size")).toBe(56);
    expect(wrapper.findComponent({ name: "LeaderFieldStub" }).props("initialPage")).toEqual(
      record.leaderPage,
    );
    const picker = wrapper.findComponent({ name: "DepartmentFieldStub" });
    expect(picker.props("multiple")).toBe(false);
    expect(picker.props("excludeDepartmentId")).toBe("11");
    expect(picker.props("modelValue")).toEqual([{ id: "1", name: "测试组织", primary: true }]);
    picker.vm.$emit("update:modelValue", [{ id: "2", name: "产品", primary: true }]);
    await wrapper
      .findAll("button")
      .find((item) => item.text() === "保存")!
      .trigger("click");
    await flushPromises();
    expect(state.edit).toHaveBeenCalledExactlyOnceWith("11", {
      expectedVersion: "4",
      department: { parentId: "2", name: "研发", sortOrder: 1 },
    });
    expect(state.get).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });
  it("无Tab，负责人独立权限用户只提交负责人差量", async () => {
    state.profile = false;
    const wrapper = await open();
    expect(wrapper.get("[data-tabs]").attributes("data-tabs")).toBe("false");
    expect(wrapper.findComponent({ name: "LeaderFieldStub" }).props("editing")).toBe(true);
    wrapper
      .findComponent({ name: "LeaderFieldStub" })
      .vm.$emit("change", { addMemberIds: ["102"], removeMemberIds: [] });
    await flushPromises();
    await wrapper
      .findAll("button")
      .find((item) => item.text() === "保存")!
      .trigger("click");
    await flushPromises();
    expect(state.edit).toHaveBeenCalledExactlyOnceWith("11", {
      expectedVersion: "4",
      leaders: { addMemberIds: ["102"], removeMemberIds: [] },
    });
    wrapper.unmount();
  });
  it("同时修改时只发一个请求，409保留两部分草稿", async () => {
    state.edit.mockRejectedValue({ code: "RevisionConflict" });
    const wrapper = await open();
    await wrapper.get("input").setValue("产品");
    wrapper
      .findComponent({ name: "LeaderFieldStub" })
      .vm.$emit("change", { addMemberIds: ["102"], removeMemberIds: [] });
    await flushPromises();
    await wrapper
      .findAll("button")
      .find((item) => item.text() === "保存")!
      .trigger("click");
    await flushPromises();
    expect(state.edit).toHaveBeenCalledExactlyOnceWith("11", {
      expectedVersion: "4",
      department: { parentId: "1", name: "产品", sortOrder: 1 },
      leaders: { addMemberIds: ["102"], removeMemberIds: [] },
    });
    expect((wrapper.get("input").element as HTMLInputElement).value).toBe("产品");
    expect(wrapper.text()).toContain("草稿已保留");
    wrapper.unmount();
  });
});
