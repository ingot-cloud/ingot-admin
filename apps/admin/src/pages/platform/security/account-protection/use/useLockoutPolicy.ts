import type { AccountLockoutPolicy } from "@base/models";
import {
  GetAccountLockoutPoliciesAPI,
  UpdateAccountLockoutPolicyAPI,
} from "@base/api/platform/security/accountLockoutPolicy";
import { LOCKOUT_EFFECT_MESSAGE } from "../constants";

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
  const loading = ref(false);
  const saving = ref(false);
  const policyMap = ref<AccountLockoutPolicyMap>({});
  const message = useMessage();

  const loadAll = async (): Promise<void> => {
    loading.value = true;
    try {
      const response = await GetAccountLockoutPoliciesAPI();
      policyMap.value = pickPolicyMap(response.data ?? []);
    } finally {
      loading.value = false;
    }
  };

  const savePolicy: SaveLockoutPolicyFn = async (policy) => {
    saving.value = true;
    try {
      await UpdateAccountLockoutPolicyAPI(policy);
      message.success(LOCKOUT_EFFECT_MESSAGE);
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
