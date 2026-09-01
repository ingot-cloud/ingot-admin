import { Message, Confirm } from "@/utils/message";

export const useMessage = () => {
  return {
    warning: Message.warning,
    error: Message.error,
    success: Message.success,
  };
};

export const useMessageConfirm = () => {
  return {
    warning: Confirm.warning,
    error: Confirm.error,
    success: Confirm.success,
  };
};
