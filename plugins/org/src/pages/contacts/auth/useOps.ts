import type { RoleTreeNodeVO } from "@/models";
import { copyParams } from "@ingot/admin-core";
import { OrgRoleBindAuthoritiesQueryOptions, orgRoleQueryKeys } from "@/api/org/role.query";
import { useQuery, useQueryClient } from "@tanstack/vue-query";

export const useOps = () => {
  const queryClient = useQueryClient();
  const currentNode = reactive<RoleTreeNodeVO>({ id: "", name: "" });
  const query = useQuery(() => OrgRoleBindAuthoritiesQueryOptions(() => currentNode.id ?? ""));
  const records = computed(() => query.data.value ?? []);
  const loading = computed(() => query.isFetching.value);

  const fetchData = (): void => {
    if (!currentNode.id) {
      return;
    }
    void queryClient.invalidateQueries({ queryKey: orgRoleQueryKeys.permissions(currentNode.id) });
  };

  const handleTreeNodeClick = (node: RoleTreeNodeVO): void => {
    copyParams(currentNode, node);
  };

  return {
    loading,
    records,
    currentNode,
    fetchData,
    handleTreeNodeClick,
  };
};
