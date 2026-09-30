import { isApiError, Message, refreshSessionPermissions } from "@ingot/admin-core";
/** 失败保留草稿，刷新权限仅在真实 403，503 提供明确重试。 */
export async function iamEditorFailure(error: unknown): Promise<void> {
  if (isApiError(error) && error.status === 403) {
    await refreshSessionPermissions({ refreshMenusIfVersionChanged: true });
    Message.warning("权限已变化，已刷新权限；草稿已保留");
  } else if (isApiError(error) && error.status === 409) {
    Message.warning("配置已变化，草稿已保留，请重新加载最新版本并预览");
  } else if (isApiError(error) && error.status === 503) {
    Message.warning("授权服务暂不可用，草稿已保留，请重试");
  }
}
