import { ElMessage, ElMessageBox } from "element-plus";

type MessageType = "" | "success" | "warning" | "info" | "error";

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

export interface Options2 {
  cancelButtonText?: string;
  confirmButtonText?: string;
  title?: string;
  type?: MessageType;
}

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

const defaultConfirmOptions = {
  cancelButtonText: "取消",
  confirmButtonText: "确定",
  title: "提示",
  type: "warning",
};

export class Confirm {
  static warning(message: string, options?: Options2): Promise<any> {
    options = Object.assign(defaultConfirmOptions, options);
    options.type = "warning";
    return ElMessageBox.confirm(message, options.title as string, options);
  }

  static error(message: string, options?: Options2): Promise<any> {
    options = Object.assign(defaultConfirmOptions, options);
    options.type = "error";
    return ElMessageBox.confirm(message, options.title as string, options);
  }

  static success(message: string, options?: Options2): Promise<any> {
    options = Object.assign(defaultConfirmOptions, options);
    options.type = "success";
    return ElMessageBox.confirm(message, options.title as string, options);
  }
}
