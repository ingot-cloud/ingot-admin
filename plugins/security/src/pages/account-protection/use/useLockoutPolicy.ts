import { useActiveSecurityRead, SecurityAction } from "@/hooks/useSecurityTabs";
import type { AccountLockoutPolicy } from "@/models";
import type { AccountProtectionTabEnum, SessionUserTypeEnum } from "@/models/enums";
import { UpdateAccountLockoutPolicyAPI } from "@/api/security/accountLockoutPolicy";
import {
  AccountLockoutPolicyQueryOptions,
  accountLockoutPolicyQueryKeys,
} from "@/api/security/accountLockoutPolicy.query";
import { LOCKOUT_EFFECT_MESSAGE } from "../constants";
import { useQuery, useQueryClient } from "@tanstack/vue-query";

export type SaveLockoutPolicyFn = (policy: AccountLockoutPolicy) => Promise<void>;

export function useLockoutPolicy(userType: SessionUserTypeEnum, tab: AccountProtectionTabEnum) {
  const enabled = useActiveSecurityRead(SecurityAction.LOCKOUT_READ, tab);
  const queryClient = useQueryClient();
  const query = useQuery(() => ({
    ...AccountLockoutPolicyQueryOptions(userType),
    enabled: enabled.value,
  }));
  const saving = ref(false);
  const config = computed(() => query.data.value ?? undefined);
  const message = useMessage();

  const loadAll = async (): Promise<void> => {
    if (enabled.value) await query.refetch();
  };

  const savePolicy: SaveLockoutPolicyFn = async (policy) => {
    saving.value = true;
    try {
      await UpdateAccountLockoutPolicyAPI(policy);
      message.success(LOCKOUT_EFFECT_MESSAGE);
      await queryClient.invalidateQueries({
        queryKey: accountLockoutPolicyQueryKeys.detail(policy.userType),
      });
    } finally {
      saving.value = false;
    }
  };

  return {
    loading: computed(() => query.isFetching.value),
    saving,
    config,
    loadAll,
    savePolicy,
  };
}
