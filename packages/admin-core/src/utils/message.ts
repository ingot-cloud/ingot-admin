import { ElMessage, type MessageBoxData } from "element-plus";
import type { VNode } from "vue";
import { openConfirmDialog, type ConfirmDialogOptions } from "./confirm-dialog";

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

export class Message {
  static warning(message: string, options?: Options): void {
    ElMessage({
      message,
      type: "warning",
      ...options,
    });
  }

  static error(message: string, options?: Options): void {
    ElMessage({
      message,
      type: "error",
      ...options,
    });
  }

  static success(message: string, options?: Options): void {
    ElMessage({
      message,
      type: "success",
      ...options,
    });
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
