import { ElMessageBox, type MessageBoxData } from "element-plus";
import { h, isVNode, type Component, type VNode } from "vue";
import IconInfoFilled from "@/components/icons/IconInfoFilled.vue";
import IconSuccessFilled from "@/components/icons/IconSuccessFilled.vue";
import IconWarningFilled from "@/components/icons/IconWarningFilled.vue";

export const CONFIRM_DIALOG_CLASS = "in-confirm-dialog";
export const CONFIRM_DIALOG_OVERLAY_CLASS = "in-confirm-dialog-overlay";
export const DEFAULT_CONFIRM_TITLE = "提示";
export const DEFAULT_CONFIRM_CANCEL_TEXT = "取消";
export const DEFAULT_CONFIRM_OK_TEXT = "确定";

export type ConfirmTone = "warning" | "error" | "success" | "info";

export type ConfirmIcon = Component | VNode | false;

export interface ConfirmDialogOptions {
  title?: string;
  type?: ConfirmTone;
  icon?: ConfirmIcon;
  showClose?: boolean;
  cancelButtonText?: string;
  confirmButtonText?: string;
  closeOnClickModal?: boolean;
  closeOnPressEscape?: boolean;
  distinguishCancelAndClose?: boolean;
}

const DEFAULT_ICONS: Record<ConfirmTone, Component> = {
  warning: IconWarningFilled,
  error: IconWarningFilled,
  success: IconSuccessFilled,
  info: IconInfoFilled,
};

const resolveIcon = (icon: ConfirmIcon | undefined, tone: ConfirmTone): VNode | null => {
  if (icon === false) {
    return null;
  }
  if (isVNode(icon)) {
    return h("div", { class: "in-confirm-dialog__icon" }, [icon]);
  }
  if (icon) {
    return h(icon, { class: "in-confirm-dialog__icon" });
  }
  return h(DEFAULT_ICONS[tone], {
    class: ["in-confirm-dialog__icon", `is-${tone}`],
  });
};

export const renderConfirmMessage = (
  message: string | VNode,
  options: ConfirmDialogOptions = {},
): VNode => {
  const tone = options.type ?? "warning";
  const title = options.title ?? DEFAULT_CONFIRM_TITLE;
  const icon = resolveIcon(options.icon, tone);
  const content = isVNode(message)
    ? h("div", { class: "in-confirm-dialog__content" }, [message])
    : h("p", { class: "in-confirm-dialog__message" }, message);

  return h("div", { class: "in-confirm-dialog__body" }, [
    icon,
    h("div", { class: "in-confirm-dialog__texts" }, [
      h("div", { class: "in-confirm-dialog__title" }, title),
      content,
    ]),
  ]);
};

export const openConfirmDialog = (
  message: string | VNode,
  options: ConfirmDialogOptions = {},
): Promise<MessageBoxData> => {
  const showClose = options.showClose ?? true;
  const tone = options.type ?? "warning";
  return ElMessageBox.confirm(renderConfirmMessage(message, { ...options, type: tone }), {
    customClass: [CONFIRM_DIALOG_CLASS, showClose ? "is-closable" : "is-no-close"].join(" "),
    modalClass: CONFIRM_DIALOG_OVERLAY_CLASS,
    showClose,
    cancelButtonText: options.cancelButtonText ?? DEFAULT_CONFIRM_CANCEL_TEXT,
    confirmButtonText: options.confirmButtonText ?? DEFAULT_CONFIRM_OK_TEXT,
    closeOnClickModal: options.closeOnClickModal ?? false,
    closeOnPressEscape: options.closeOnPressEscape ?? showClose,
    distinguishCancelAndClose: options.distinguishCancelAndClose,
  });
};
