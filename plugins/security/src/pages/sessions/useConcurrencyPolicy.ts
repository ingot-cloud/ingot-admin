import type { SessionConcurrencyPolicy } from "@/models";
import { SessionConcurrencyScopeEnum } from "@/models/enums";
import {
  GetConcurrencyPoliciesAPI,
  DeleteConcurrencyPolicyAPI,
} from "@/api/security/concurrencyPolicy";

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
  const loading = ref(false);
  const tableData = ref<Array<SessionConcurrencyPolicy>>([]);
  const message = useMessage();
  const confirm = useMessageConfirm();

  const loadAll = async (): Promise<void> => {
    loading.value = true;
    try {
      const response = await GetConcurrencyPoliciesAPI();
      tableData.value = sortPolicies(response.data ?? []);
    } finally {
      loading.value = false;
    }
  };

  const removePolicy = (policy: SessionConcurrencyPolicy): void => {
    if (!policy.id) {
      return;
    }
    if (policy.scope === SessionConcurrencyScopeEnum.GLOBAL) {
      message.warning("全局兜底策略不可删除，可将最大会话数改为 0 以关闭限制");
      return;
    }
    confirm.warning(`是否删除并发策略?`).then(() => {
      DeleteConcurrencyPolicyAPI(policy.id!).then(() => {
        message.success("删除成功");
        loadAll();
      });
    });
  };

  return {
    loading,
    tableData,
    loadAll,
    removePolicy,
  };
};
