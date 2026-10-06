import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";
import FieldStep from "./FieldStep.vue";
import { FieldVisibility, ScopeKind } from "@ingot/admin-common";
import type { SelectedGrant } from "../wizard";
vi.mock("@ingot/admin-common", () => ({
  FieldVisibility: { HIDDEN: "HIDDEN", MASKED: "MASKED", FULL: "FULL" },
  ScopeKind: { ALL: "ALL" },
}));
vi.mock("@ingot/admin-core", () => ({ Message: { warning: vi.fn() } }));
const select = defineComponent({
  props: ["modelValue"],
  emits: ["change"],
  template: `<select :value="modelValue" @change="$emit('change', $event.target.value)"><option value="MASKED">脱敏</option><option value="FULL">完整</option></select>`,
});
const pagination = defineComponent({
  props: ["currentPage"],
  emits: ["update:current-page"],
  template: `<button class="page" @click="$emit('update:current-page', currentPage === 1 ? 2 : 1)">换页</button>`,
});
const data = (): SelectedGrant[] => [
  {
    actionId: "1",
    actionCode: "app:member:read",
    actionName: "读取",
    applicationId: "2",
    applicationName: "应用",
    resourceId: "3",
    resourceName: "成员",
    scopes: [{ kind: ScopeKind.ALL }],
    scopeCapabilities: [ScopeKind.ALL],
    fieldCapabilities: Array.from({ length: 25 }, (_, index) => ({
      key: `field${index}`,
      label: `字段${index}`,
      visibilities: [FieldVisibility.MASKED, FieldVisibility.FULL],
      editable: true,
      filterable: false,
      sortable: false,
    })),
    fieldDefaults: Object.fromEntries(
      Array.from({ length: 25 }, (_, index) => [
        `field${index}`,
        { visibility: FieldVisibility.MASKED, editable: false },
      ]),
    ),
  },
];
const options = {
  global: {
    stubs: {
      InLoading: { template: "<div><slot /></div>" },
      ElEmpty: { props: ["description"], template: "<div>{{ description }}</div>" },
      ElInput: { template: "<input />" },
      ElSelect: select,
      ElOption: true,
      ElCheckbox: true,
      ElPagination: pagination,
    },
  },
};
describe("角色字段步骤", () => {
  it("跨页保留草稿，每个资源仅配置一次并使用后端默认", async () => {
    let draft = data();
    const wrapper = mount(FieldStep, {
      ...options,
      props: {
        modelValue: draft,
        "onUpdate:modelValue": (value: SelectedGrant[]) => {
          draft = value;
          void wrapper.setProps({ modelValue: draft });
        },
      },
    });
    expect(wrapper.findAll("select")).toHaveLength(20);
    expect(wrapper.text()).toContain("已配置 25 / 25");
    await wrapper.find("select").setValue("FULL");
    await wrapper.find(".page").trigger("click");
    await flushPromises();
    expect(wrapper.findAll("select")).toHaveLength(5);
    await wrapper.find("select").setValue("FULL");
    await wrapper.find(".page").trigger("click");
    await flushPromises();
    expect(wrapper.find("select").element.value).toBe("FULL");
    expect(draft[0].fieldPermissions?.field20.visibility).toBe(FieldVisibility.FULL);
    await wrapper.setProps({ modelValue: [] });
    expect(wrapper.text()).toContain("当前权限没有可配置字段");
  });
  it("全局校验定位第二页的非法配置", async () => {
    const draft = data();
    draft[0].fieldPermissions = {
      field24: { visibility: FieldVisibility.HIDDEN, editable: false },
    };
    const wrapper = mount(FieldStep, { ...options, props: { modelValue: draft } });
    expect((wrapper.vm as unknown as { validate(): boolean }).validate()).toBe(false);
    await flushPromises();
    expect(wrapper.findAll("select")).toHaveLength(5);
    expect(wrapper.text()).toContain("字段24");
  });
});
