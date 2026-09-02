import type { LoginFailureProtectionPolicyVO } from "@/models";
import {
  GetLoginFailurePoliciesAPI,
  UpdateLoginFailurePolicyAPI,
} from "@/api/security/loginFailurePolicy";

export type LoginFailurePolicyMap = Record<string, LoginFailureProtectionPolicyVO | undefined>;

export type SavePolicyFn = (policy: LoginFailureProtectionPolicyVO) => Promise<void>;

const POLICY_EFFECT_MESSAGE = "登录失败保护策略将在数秒内生效";

function pickPolicyMap(list: Array<LoginFailureProtectionPolicyVO>): LoginFailurePolicyMap {
  const map: LoginFailurePolicyMap = {};
  for (const item of list) {
    if (!item.dimension) {
      continue;
    }
    map[item.dimension] = item;
  }
  return map;
}

export function useLoginFailurePolicy() {
  const loading = ref(false);
  const saving = ref(false);
  const policyMap = ref<LoginFailurePolicyMap>({});
  const message = useMessage();

  const loadAll = async (): Promise<void> => {
    loading.value = true;
    try {
      const response = await GetLoginFailurePoliciesAPI();
      policyMap.value = pickPolicyMap(response.data);
    } finally {
      loading.value = false;
    }
  };

  const savePolicy = async (policy: LoginFailureProtectionPolicyVO): Promise<void> => {
    saving.value = true;
    try {
      await UpdateLoginFailurePolicyAPI(policy);
      message.success(POLICY_EFFECT_MESSAGE);
      await loadAll();
    } finally {
      saving.value = false;
    }
  };

  return {
    loading,
    saving,
    policyMap,
    loadAll,
    savePolicy,
  };
}
