import type { LoginFailureProtectionPolicyVO } from "@/models";
import { UpdateLoginFailurePolicyAPI } from "@/api/security/loginFailurePolicy";
import {
  LoginFailurePolicyListQueryOptions,
  loginFailurePolicyQueryKeys,
} from "@/api/security/loginFailurePolicy.query";
import { useQuery, useQueryClient } from "@tanstack/vue-query";

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
  const queryClient = useQueryClient();
  const query = useQuery(() => LoginFailurePolicyListQueryOptions());
  const saving = ref(false);
  const policyMap = computed(() => pickPolicyMap(query.data.value ?? []));
  const message = useMessage();

  const loadAll = async (): Promise<void> => {
    await query.refetch();
  };

  const savePolicy = async (policy: LoginFailureProtectionPolicyVO): Promise<void> => {
    saving.value = true;
    try {
      await UpdateLoginFailurePolicyAPI(policy);
      message.success(POLICY_EFFECT_MESSAGE);
      await queryClient.invalidateQueries({ queryKey: loginFailurePolicyQueryKeys.lists() });
    } finally {
      saving.value = false;
    }
  };

  return {
    loading: computed(() => query.isFetching.value),
    saving,
    policyMap,
    loadAll,
    savePolicy,
  };
}
