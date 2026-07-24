import type { CredentialPolicyConfig } from "@/models";
import {
  CreatePolicyConfig,
  GetPolicyConfigList,
  UpdatePolicyConfig,
} from "@/api/platform/security/credential";

export type PolicyMap = Record<string, CredentialPolicyConfig | undefined>;

export type SavePolicyFn = (
  policyType: string,
  meta: { id?: string; enabled: boolean },
  policyConfig: Record<string, unknown>,
) => Promise<void>;

const DEFAULT_PRIORITY = 0;

function pickConfigByType(list: CredentialPolicyConfig[]): PolicyMap {
  const map: PolicyMap = {};

  for (const item of list) {
    if (!item.policyType) {
      continue;
    }

    const existing = map[item.policyType];
    if (!existing || (item.priority ?? 0) > (existing.priority ?? 0)) {
      map[item.policyType] = item;
    }
  }

  return map;
}

export function useCredentialPolicy() {
  const loading = ref(false);
  const policyMap = ref<PolicyMap>({});
  const message = useMessage();

  const loadAll = async (): Promise<void> => {
    loading.value = true;
    try {
      const response = await GetPolicyConfigList();
      policyMap.value = pickConfigByType(response.data);
    } finally {
      loading.value = false;
    }
  };

  const savePolicy: SavePolicyFn = async (policyType, meta, policyConfig) => {
    const payload: CredentialPolicyConfig = {
      id: meta.id,
      policyType,
      enabled: meta.enabled,
      priority: DEFAULT_PRIORITY,
      policyConfig,
    };

    if (meta.id) {
      await UpdatePolicyConfig(payload);
    } else {
      await CreatePolicyConfig(payload);
    }

    message.success("保存成功");
  };

  return {
    loading,
    policyMap,
    loadAll,
    savePolicy,
  };
}
