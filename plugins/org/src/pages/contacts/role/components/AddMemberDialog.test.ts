import { afterEach, describe, expect, it, vi } from "vitest";
import { enableAutoUnmount, flushPromises, mount } from "@vue/test-utils";
import { reactive, ref, nextTick } from "vue";
import { createPinia, setActivePinia } from "pinia";
import { QueryClient, VueQueryPlugin } from "@tanstack/vue-query";
import AddMemberDialog from "./AddMemberDialog.vue";

const fixture = vi.hoisted(() => ({ bind: vi.fn() }));
vi.mock("@/api/org/role", () => ({ BindUserAPI: fixture.bind }));
vi.mock("@ingot/admin-core", async (original) => ({
  ...(await original<typeof import("@ingot/admin-core")>()),
  useServerPaging: () => ({
    fetching: ref(false),
    pageInfo: ref({
      current: 1,
      size: 20,
      total: 2,
      records: [
        { userId: "1", nickname: "可绑定成员", canBind: true },
        { userId: "2", nickname: "已绑定成员", canBind: false },
      ],
    }),
    condition: reactive({ roleId: "", nickname: "" }),
    search: vi.fn(),
    fetchData: vi.fn(),
  }),
}));
enableAutoUnmount(afterEach);

describe("角色绑定成员对话框原生 selection 回归", () => {
  it("真实勾选框、逐条禁用及全选传递正确的绑定 ID", async () => {
    setActivePinia(createPinia());
    fixture.bind.mockResolvedValue({ success: true });
    const wrapper = mount(AddMemberDialog, {
      attachTo: document.body,
      global: {
        plugins: [[VueQueryPlugin, { queryClient: new QueryClient() }]],
        stubs: {
          InDialog: {
            props: ["modelValue"],
            template: "<div v-if='modelValue'><slot/><slot name='footer'/></div>",
          },
          InButton: {
            emits: ["click"],
            template: `<button @click="$emit('click')"><slot/></button>`,
          },
          InAvatar: true,
          ElPagination: true,
          SelectDeptDialog: true,
        },
      },
    });
    wrapper.vm.show({ id: "role-1", name: "角色", filterDept: false });
    await nextTick();
    await flushPromises();
    const checks = wrapper.findAll(".el-table__body input[type=checkbox]");
    expect(checks).toHaveLength(2);
    expect(checks[1].attributes("disabled")).toBeDefined();
    await wrapper.get(".el-table__header input[type=checkbox]").setValue(true);
    await vi.waitFor(() => expect((checks[0].element as HTMLInputElement).checked).toBe(true));
    await wrapper
      .findAll("button")
      .find((button) => button.text() === "确定")!
      .trigger("click");
    await flushPromises();
    expect(fixture.bind).toHaveBeenCalledWith({
      id: "role-1",
      assignIds: ["1"],
      deptId: undefined,
    });
  });
});
