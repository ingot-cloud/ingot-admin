import { describe, expect, it, vi } from "vitest";
import { defineComponent, h, reactive, ref, nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { useSecurityPolicyDrawer } from "./useSecurityPolicyDrawer";

vi.mock("@ingot/admin-core", () => ({
  useDetailEditSession: () => {
    const editing = ref(false);
    return {
      editing,
      enterEdit: () => {
        editing.value = true;
      },
      exitEdit: () => {
        editing.value = false;
      },
      confirmLeave: async () => !editing.value,
    };
  },
}));
function setup(existing = true, writable = true) {
  const form = reactive({ name: "原值", patternList: [{ path: "/auth/**", method: "POST" }] });
  const canWrite = ref(writable);
  const visible = ref(true);
  const saving = ref(false);
  let editor!: ReturnType<typeof useSecurityPolicyDrawer>;
  const wrapper = mount(
    defineComponent({
      setup() {
        editor = useSecurityPolicyDrawer({
          form,
          formRef: ref(),
          visible,
          existing: ref(existing),
          canWrite,
          saving,
        });
        editor.open(existing);
        return () => h("div");
      },
    }),
  );
  return { editor, form, canWrite, visible, saving, cleanup: () => wrapper.unmount() };
}

describe("安全策略详情编辑会话", () => {
  it("已有策略默认预览，取消恢复嵌套草稿且不污染原路径", () => {
    const page = setup();
    expect(page.editor.editing.value).toBe(false);
    page.editor.enterEdit();
    page.form.name = "草稿";
    page.form.patternList[0]!.path = "/changed/**";
    page.editor.cancelEdit();
    expect(page.form).toEqual({
      name: "原值",
      patternList: [{ path: "/auth/**", method: "POST" }],
    });
    expect(page.editor.editing.value).toBe(false);
    expect(page.visible.value).toBe(true);
    page.cleanup();
  });
  it("新建直接编辑，取消关闭；只读人员不能进入编辑", () => {
    const create = setup(false);
    expect(create.editor.editing.value).toBe(true);
    create.editor.cancelEdit();
    expect(create.visible.value).toBe(false);
    create.cleanup();
    const readonly = setup(true, false);
    readonly.editor.enterEdit();
    expect(readonly.editor.editing.value).toBe(false);
    readonly.cleanup();
  });
  it("撤销权限恢复预览，保存中取消与关闭不会丢失草稿", async () => {
    const page = setup();
    page.editor.enterEdit();
    page.form.name = "草稿";
    page.saving.value = true;
    page.editor.cancelEdit();
    let closed = false;
    await page.editor.beforeClose(() => {
      closed = true;
    });
    expect(closed).toBe(false);
    expect(page.form.name).toBe("草稿");
    page.canWrite.value = false;
    await nextTick();
    expect(page.editor.editing.value).toBe(false);
    expect(page.form.name).toBe("原值");
    page.cleanup();
  });
});
