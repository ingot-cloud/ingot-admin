import type { ViolationEscalationConfig } from "@/models";
import { UpdateViolationEscalationAPI } from "@/api/security/policy";
import {
  ViolationEscalationQueryOptions,
  violationEscalationQueryKeys,
} from "@/api/security/policy.query";
import { useQuery, useQueryClient } from "@tanstack/vue-query";

const POLICY_EFFECT_MESSAGE = "规则将在数秒内生效";

export function useViolationEscalation() {
  const queryClient = useQueryClient();
  const query = useQuery(() => ViolationEscalationQueryOptions());
  const saving = ref(false);
  const config = computed(() => query.data.value);
  const message = useMessage();

  const load = async (): Promise<void> => {
    await query.refetch();
  };

  const save = async (payload: ViolationEscalationConfig): Promise<void> => {
    saving.value = true;
    try {
      await UpdateViolationEscalationAPI(payload);
      message.success(POLICY_EFFECT_MESSAGE);
      await queryClient.invalidateQueries({
        queryKey: violationEscalationQueryKeys.detail("current"),
      });
    } finally {
      saving.value = false;
    }
  };

  return {
    loading: computed(() => query.isFetching.value),
    saving,
    config,
    load,
    save,
  };
}
