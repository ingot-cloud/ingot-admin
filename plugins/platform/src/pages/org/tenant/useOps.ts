import type { SysTenant } from "@/models";
import { TenantUpdateAPI } from "@/api/platform/org/tenant";
import { TenantPageQueryOptions, tenantQueryKeys } from "@/api/platform/org/tenant.query";
import {
  getCommonStatusToggle,
  Message,
  silentQueryRequest,
  useServerPaging,
} from "@ingot/admin-core";
import { useMutation, useQueryClient } from "@tanstack/vue-query";

export const useOps = () => {
  const queryClient = useQueryClient();
  const paging = useServerPaging<SysTenant, SysTenant>({
    queryOptions: TenantPageQueryOptions,
  });

  const statusMutation = useMutation({
    mutationFn: (params: SysTenant) => TenantUpdateAPI(params, silentQueryRequest()),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tenantQueryKeys.lists() });
    },
  });

  const refreshData = (): void => {
    paging.search();
  };

  const handleToggleStatus = (item: SysTenant): void => {
    if (!item.id || !item.status) {
      return;
    }
    const next = getCommonStatusToggle(item.status);
    void statusMutation.mutateAsync({ id: item.id, status: next }).then(() => {
      Message.success("操作成功");
    });
  };

  return {
    paging,
    refreshData,
    handleToggleStatus,
  };
};
