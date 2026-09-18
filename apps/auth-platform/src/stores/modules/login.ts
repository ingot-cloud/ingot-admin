import type { LoginResult, TenantCandidate, TransactionView } from "@ingot/auth-core";
import { authApi, authEntry, LoginAPI, SelectTenantAPI } from "@/api/challenge";

export const useLoginStore = defineStore("app.login", () => {
  const transactionId = ref("");
  const loginResult = ref<LoginResult | undefined>(undefined);
  const transaction = ref<TransactionView | undefined>(undefined);

  const setTransactionId = (value: string) => {
    transactionId.value = value;
  };

  const restoreTransaction = async (id: string): Promise<TransactionView> => {
    await authApi.ensureCsrfForTransaction(id);
    const response = await authApi.readTransaction(id);
    transaction.value = response.data;
    transactionId.value = response.data.transactionId;
    return response.data;
  };

  const preAuthorize = ({
    username,
    password,
  }: {
    username: string;
    password: string;
  }): Promise<LoginResult> => {
    return LoginAPI({
      username,
      password,
      transactionId: transactionId.value,
    }).then((result) => {
      loginResult.value = result;
      return result;
    });
  };

  const selectTenant = (tenant: string): Promise<LoginResult> => {
    return SelectTenantAPI(transactionId.value, tenant).then((result) => {
      loginResult.value = result;
      if (result.stage === "READY" && result.completionUrl) {
        window.location.assign(result.completionUrl);
      }
      return result;
    });
  };

  const followReady = (result: LoginResult) => {
    if (result.stage === "READY" && result.completionUrl) {
      window.location.assign(result.completionUrl);
    }
  };

  const tenantCandidates = computed<TenantCandidate[]>(() => loginResult.value?.allows ?? []);

  return {
    authEntry,
    transactionId,
    loginResult,
    transaction,
    tenantCandidates,
    setTransactionId,
    restoreTransaction,
    preAuthorize,
    selectTenant,
    followReady,
  };
});
