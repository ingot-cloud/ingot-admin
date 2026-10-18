import { isApiError, Message, refreshSessionPermissions } from "@ingot/admin-core";
/** 失败保留草稿，刷新权限仅在真实 403，503 提供明确重试。 */
export async function iamEditorFailure(error: unknown): Promise<void> {
  if (isApiError(error) && error.status === 403) {
    try {
      await refreshSessionPermissions({ refreshMenusIfVersionChanged: true });
      Message.warning("权限已变化，已刷新权限；草稿已保留");
    } catch {
      Message.warning("权限刷新暂不可用，草稿已保留，请重试");
    }
  } else if (isApiError(error) && error.status === 409) {
    Message.warning("配置已变化，草稿已保留，请重新读取当前配置并预览");
  } else if (isApiError(error) && error.status === 410) {
    Message.warning("此接口已退出，请使用当前角色入口");
  } else if (isApiError(error) && error.status === 503) {
    Message.warning("授权服务暂不可用，草稿已保留，请重试");
  }
}
