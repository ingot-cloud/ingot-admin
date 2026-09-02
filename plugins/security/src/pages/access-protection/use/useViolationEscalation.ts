import type { ViolationEscalationConfig } from "@/models";
import {
  GetViolationEscalationAPI,
  UpdateViolationEscalationAPI,
} from "@/api/security/policy";

const POLICY_EFFECT_MESSAGE = "规则将在数秒内生效";

export function useViolationEscalation() {
  const loading = ref(false);
  const saving = ref(false);
  const config = ref<ViolationEscalationConfig>();
  const message = useMessage();

  const load = async (): Promise<void> => {
    loading.value = true;
    try {
      const response = await GetViolationEscalationAPI();
      config.value = response.data;
    } finally {
      loading.value = false;
    }
  };

  const save = async (payload: ViolationEscalationConfig): Promise<void> => {
    saving.value = true;
    try {
      await UpdateViolationEscalationAPI(payload);
      message.success(POLICY_EFFECT_MESSAGE);
      await load();
    } finally {
      saving.value = false;
    }
  };

  return {
    loading,
    saving,
    config,
    load,
    save,
  };
}
