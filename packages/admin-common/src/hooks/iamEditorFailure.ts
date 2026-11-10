import { isApiError, Message, refreshSessionPermissions, type ApiError } from "@ingot/admin-core";

const UNCONFIRMED_RESULT = "暂未收到有效结果，请刷新后核对";

function failureReason(error: ApiError): string {
  if (error.kind === "network") return "网络连接异常，请恢复连接后重试";
  if (error.kind === "timeout") return "请求超时，请刷新并核对结果";
  const message = error.message.trim();
  if (message && message !== error.code && message !== "操作失败") return message;
  switch (error.status) {
    case 400:
      return "提交的内容不符合要求，请检查表单";
    case 403:
      return "当前权限不允许此操作";
    case 404:
      return "所选记录不存在或不可访问，请刷新后重试";
    case 409:
      return "记录已变化，请重新打开最新记录后再提交";
    case 503:
      return "服务暂不可用，请稍后重试";
    default:
      return UNCONFIRMED_RESULT;
  }
}

/** 展示由本地接管的失败，并在授权拒绝时刷新菜单与能力。 */
export async function iamEditorFailure(error: unknown, operation?: string): Promise<void> {
  if (!isApiError(error)) {
    if (operation) Message.warning(`${operation}，${UNCONFIRMED_RESULT}`);
    return;
  }
  if (error.cancelled || error.status === 401) return;

  if (error.config?.feedback === "silent" || !error.config) {
    const reason = failureReason(error);
    Message.warning(operation ? `${operation}，${reason}` : reason);
  }

  if (error.status === 403) {
    await refreshSessionPermissions({ refreshMenusIfVersionChanged: true }).catch(() => undefined);
  }
}
