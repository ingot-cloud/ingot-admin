import { computed, nextTick, toRaw, watch, type Ref } from "vue";
import { useDetailEditSession } from "@ingot/admin-core";
import type { FormInstance } from "element-plus";

/** Existing policy details open in preview; drafts are isolated from table records. */
export function useSecurityPolicyDrawer<T extends object>(options: {
  form: T;
  formRef: Ref<FormInstance | undefined>;
  visible: Ref<boolean>;
  existing: Ref<boolean>;
  canWrite: Ref<boolean>;
  saving: Ref<boolean>;
}) {
  const session = useDetailEditSession();
  let snapshot: T | undefined;
  const editing = computed(() => session.editing.value && options.canWrite.value);
  const enterEdit = (): void => {
    if (!options.canWrite.value || options.saving.value) return;
    snapshot = structuredClone(toRaw(options.form));
    session.enterEdit();
    void nextTick(() => options.formRef.value?.clearValidate());
  };
  const cancelEdit = (): void => {
    if (options.saving.value) return;
    if (snapshot) Object.assign(options.form, structuredClone(snapshot));
    session.exitEdit();
    if (!options.existing.value) options.visible.value = false;
    void nextTick(() => options.formRef.value?.clearValidate());
  };
  const open = (existing: boolean): void => {
    session.exitEdit();
    snapshot = undefined;
    if (!existing) enterEdit();
  };
  const beforeClose = async (done: () => void): Promise<void> => {
    if (options.saving.value || !(await session.confirmLeave())) return;
    cancelEdit();
    done();
  };
  watch(options.canWrite, (allowed) => {
    if (!allowed && session.editing.value) {
      if (snapshot) Object.assign(options.form, structuredClone(snapshot));
      session.exitEdit();
    }
  });
  return { editing, enterEdit, cancelEdit, open, beforeClose };
}
