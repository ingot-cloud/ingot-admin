import { Confirm } from "@/utils/message";

export const UNSAVED_CHANGES_TITLE = "确定退出当前编辑？";
export const UNSAVED_CHANGES_MESSAGE = "退出后，修改的内容不会被保存";
export {
  CONFIRM_DIALOG_CLASS,
  CONFIRM_DIALOG_OVERLAY_CLASS,
} from "@/utils/confirm-dialog";

export const confirmUnsavedChanges = async (): Promise<boolean> => {
  try {
    await Confirm.warning(UNSAVED_CHANGES_MESSAGE, {
      title: UNSAVED_CHANGES_TITLE,
      showClose: false,
      closeOnClickModal: false,
      closeOnPressEscape: false,
    });
    return true;
  } catch {
    return false;
  }
};

export const useDetailEditSession = () => {
  const editing = ref(false);
  const saving = ref(false);

  const enterEdit = (): void => {
    editing.value = true;
  };

  const exitEdit = (): void => {
    editing.value = false;
  };

  const confirmLeave = async (): Promise<boolean> => {
    if (!editing.value) {
      return true;
    }
    const allowed = await confirmUnsavedChanges();
    if (allowed) {
      editing.value = false;
    }
    return allowed;
  };

  return {
    editing,
    saving,
    enterEdit,
    exitEdit,
    confirmLeave,
  };
};
