import { BroadcastPolicyInvalidationAPI } from "@/api/platform/security/policy";

export function useGatewayPolicy() {
  const message = useMessage();
  const confirm = useMessageConfirm();
  const broadcasting = ref(false);

  const broadcastInvalidation = async (): Promise<void> => {
    await confirm.warning("确认强制刷新全部网关策略缓存？");
    broadcasting.value = true;
    try {
      await BroadcastPolicyInvalidationAPI();
      message.success("规则将在数秒内生效");
    } finally {
      broadcasting.value = false;
    }
  };

  return {
    broadcasting,
    broadcastInvalidation,
  };
}
