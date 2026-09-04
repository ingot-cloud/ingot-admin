import type { AccountLockoutPolicy } from "@/models";
import { UpdateAccountLockoutPolicyAPI } from "@/api/security/accountLockoutPolicy";
import {
  AccountLockoutPolicyListQueryOptions,
  accountLockoutPolicyQueryKeys,
} from "@/api/security/accountLockoutPolicy.query";
import { LOCKOUT_EFFECT_MESSAGE } from "../constants";
import { useQuery, useQueryClient } from "@tanstack/vue-query";

export type AccountLockoutPolicyMap = Record<string, AccountLockoutPolicy | undefined>;

export type SaveLockoutPolicyFn = (policy: AccountLockoutPolicy) => Promise<void>;

function pickPolicyMap(list: Array<AccountLockoutPolicy>): AccountLockoutPolicyMap {
  const map: AccountLockoutPolicyMap = {};
  for (const item of list) {
    if (!item.userType) {
      continue;
    }
    map[item.userType] = item;
  }
  return map;
}

export function useLockoutPolicy() {
  const queryClient = useQueryClient();
  const query = useQuery(() => AccountLockoutPolicyListQueryOptions());
  const saving = ref(false);
  const policyMap = computed(() => pickPolicyMap(query.data.value ?? []));
  const message = useMessage();

  const loadAll = async (): Promise<void> => {
    await query.refetch();
  };

  const savePolicy: SaveLockoutPolicyFn = async (policy) => {
    saving.value = true;
    try {
      await UpdateAccountLockoutPolicyAPI(policy);
      message.success(LOCKOUT_EFFECT_MESSAGE);
      await queryClient.invalidateQueries({ queryKey: accountLockoutPolicyQueryKeys.lists() });
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
