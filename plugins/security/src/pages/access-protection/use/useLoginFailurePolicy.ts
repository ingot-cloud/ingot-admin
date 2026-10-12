import { useActiveSecurityRead, SecurityAction } from "@/hooks/useSecurityTabs";
import type { LoginFailureProtectionPolicyVO } from "@/models";
import { UpdateLoginFailurePolicyAPI } from "@/api/security/loginFailurePolicy";
import {
  LoginFailurePolicyQueryOptions,
  loginFailurePolicyQueryKeys,
} from "@/api/security/loginFailurePolicy.query";
import { useQuery, useQueryClient } from "@tanstack/vue-query";
import { toValue, type MaybeRefOrGetter } from "vue";

export type LoginFailurePolicyMap = Record<string, LoginFailureProtectionPolicyVO | undefined>;

export type SavePolicyFn = (policy: LoginFailureProtectionPolicyVO) => Promise<void>;

const POLICY_EFFECT_MESSAGE = "登录失败保护策略将在数秒内生效";

export function useLoginFailurePolicy(dimension: MaybeRefOrGetter<string>) {
  const enabled = useActiveSecurityRead(SecurityAction.LOGIN_READ, "login-failure");
  const queryClient = useQueryClient();
  const query = useQuery(() => ({
    ...LoginFailurePolicyQueryOptions(toValue(dimension)),
    enabled: enabled.value,
  }));
  const saving = ref(false);
  const policyMap = computed(() => ({ [toValue(dimension)]: query.data.value ?? undefined }));
  const message = useMessage();

  const loadAll = async (): Promise<void> => {
    if (enabled.value) await query.refetch();
  };

  const savePolicy = async (policy: LoginFailureProtectionPolicyVO): Promise<void> => {
    saving.value = true;
    try {
      await UpdateLoginFailurePolicyAPI(policy);
      message.success(POLICY_EFFECT_MESSAGE);
      await queryClient.invalidateQueries({
        queryKey: loginFailurePolicyQueryKeys.detail(policy.dimension!),
      });
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
