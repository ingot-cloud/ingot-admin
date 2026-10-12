import { usePermissions } from "@ingot/admin-core";
/** 安全数据缓存按实际管理身份及授权 epoch 隔离。 */
export function securityQueryContext() {
  const state = usePermissions();
  return {
    contextEpoch: state.contextEpoch,
    domain: state.domain,
    memberId: state.memberId,
    tenantId: state.tenantId,
  };
}
