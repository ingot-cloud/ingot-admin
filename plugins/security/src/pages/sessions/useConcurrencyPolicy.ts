import type { SessionConcurrencyPolicy } from "@/models";
import { SessionConcurrencyScopeEnum } from "@/models/enums";
import { DeleteConcurrencyPolicyAPI } from "@/api/security/concurrencyPolicy";
import {
  ConcurrencyPolicyListQueryOptions,
  concurrencyPolicyQueryKeys,
} from "@/api/security/concurrencyPolicy.query";
import { Confirm, Message, silentQueryRequest } from "@ingot/admin-core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";

const SCOPE_ORDER: Record<string, number> = {
  [SessionConcurrencyScopeEnum.GLOBAL]: 0,
  [SessionConcurrencyScopeEnum.CLIENT]: 1,
  [SessionConcurrencyScopeEnum.USER_TYPE]: 2,
};

const sortPolicies = (list: Array<SessionConcurrencyPolicy>): Array<SessionConcurrencyPolicy> => {
  return [...list].sort((left, right) => {
    const leftScope = SCOPE_ORDER[left.scope ?? ""] ?? 9;
    const rightScope = SCOPE_ORDER[right.scope ?? ""] ?? 9;
    if (leftScope !== rightScope) {
      return leftScope - rightScope;
    }
    const clientCompare = (left.clientId ?? "").localeCompare(right.clientId ?? "");
    if (clientCompare !== 0) {
      return clientCompare;
    }
    return (left.userType ?? "").localeCompare(right.userType ?? "");
  });
};

export const useConcurrencyPolicy = () => {
  const queryClient = useQueryClient();
  const query = useQuery(() => ConcurrencyPolicyListQueryOptions());
  const tableData = computed(() => sortPolicies(query.data.value ?? []));

  const removeMutation = useMutation({
    mutationFn: (id: number) => DeleteConcurrencyPolicyAPI(id, silentQueryRequest()),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: concurrencyPolicyQueryKeys.lists() });
    },
  });

  const loadAll = async (): Promise<void> => {
    await query.refetch();
  };

  const removePolicy = (policy: SessionConcurrencyPolicy): void => {
    if (!policy.id) {
      return;
    }
    if (policy.scope === SessionConcurrencyScopeEnum.GLOBAL) {
      Message.warning("全局兜底策略不可删除，可将最大会话数改为 0 以关闭限制");
      return;
    }
    Confirm.warning(`是否删除并发策略?`).then(() => {
      removeMutation.mutateAsync(policy.id!).then(() => {
        Message.success("删除成功");
      });
    });
  };

  return {
    loading: computed(() => query.isFetching.value),
    tableData,
    loadAll,
    removePolicy,
  };
};
