import { ElMessage, type MessageBoxData } from "element-plus";
import type { VNode } from "vue";
import { openConfirmDialog, type ConfirmDialogOptions } from "./confirm-dialog";

export const MESSAGE_CLASS = "in-message";

export interface Options {
  customClass?: string;
  center?: boolean;
  dangerouslyUseHTMLString?: boolean;
  duration?: number;
  iconClass?: string;
  id?: string;
  offset?: number;
  onClose?: () => void;
  showClose?: boolean;
  zIndex?: number;
}

export type Options2 = ConfirmDialogOptions;

const mergeMessageClass = (customClass?: string): string => {
  const extra = customClass?.trim();
  return extra ? `${MESSAGE_CLASS} ${extra}` : MESSAGE_CLASS;
};

const showMessage = (
  type: "success" | "warning" | "error",
  message: string,
  options?: Options,
): void => {
  ElMessage({
    ...options,
    message,
    type,
    customClass: mergeMessageClass(options?.customClass),
  });
};

export class Message {
  static warning(message: string, options?: Options): void {
    showMessage("warning", message, options);
  }

  static error(message: string, options?: Options): void {
    showMessage("error", message, options);
  }

  static success(message: string, options?: Options): void {
    showMessage("success", message, options);
  }
}

export class Confirm {
  static warning(
    message: string | VNode,
    options?: ConfirmDialogOptions,
  ): Promise<MessageBoxData> {
    return openConfirmDialog(message, { ...options, type: "warning" });
  }

  static error(message: string | VNode, options?: ConfirmDialogOptions): Promise<MessageBoxData> {
    return openConfirmDialog(message, { ...options, type: "error" });
  }

  static success(
    message: string | VNode,
    options?: ConfirmDialogOptions,
  ): Promise<MessageBoxData> {
    return openConfirmDialog(message, { ...options, type: "success" });
  }
}

export type { ConfirmDialogOptions, ConfirmIcon, ConfirmTone } from "./confirm-dialog";
export {
  CONFIRM_DIALOG_CLASS,
  CONFIRM_DIALOG_OVERLAY_CLASS,
  DEFAULT_CONFIRM_CANCEL_TEXT,
  DEFAULT_CONFIRM_OK_TEXT,
  DEFAULT_CONFIRM_TITLE,
  openConfirmDialog,
  renderConfirmMessage,
} from "./confirm-dialog";
