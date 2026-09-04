import type { CredentialPolicyConfig } from "@/models";
import { CreatePolicyConfig, UpdatePolicyConfig } from "@/api/security/credential";
import {
  CredentialPolicyListQueryOptions,
  credentialPolicyQueryKeys,
} from "@/api/security/credential.query";
import { useQuery, useQueryClient } from "@tanstack/vue-query";

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
  const queryClient = useQueryClient();
  const query = useQuery(() => CredentialPolicyListQueryOptions());
  const policyMap = computed(() => pickConfigByType(query.data.value ?? []));
  const message = useMessage();

  const loadAll = async (): Promise<void> => {
    await query.refetch();
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
    await queryClient.invalidateQueries({ queryKey: credentialPolicyQueryKeys.lists() });
  };

  return {
    loading: computed(() => query.isFetching.value),
    policyMap,
    loadAll,
    savePolicy,
  };
}
