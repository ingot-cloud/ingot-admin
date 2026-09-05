import type { PageChangeParams, RoleTreeNodeVO, UserPageItemVO, UserQueryDTO } from "@/models";
import { UpdateUserAPI, RemoveUserAPI } from "@/api/org/user";
import { OrgUserPageQueryOptions, orgUserQueryKeys } from "@/api/org/user.query";
import {
  Confirm,
  Message,
  copyParams,
  silentQueryRequest,
  useServerPaging,
} from "@ingot/admin-core";
import { useMutation, useQueryClient } from "@tanstack/vue-query";

export const useOps = () => {
  const queryClient = useQueryClient();
  const paging = useServerPaging<UserPageItemVO, UserQueryDTO>({
    queryOptions: OrgUserPageQueryOptions,
    queryWhen: (submitted) => Boolean(submitted.roleId),
  });
  const currentNode = reactive<RoleTreeNodeVO>({});

  const statusMutation = useMutation({
    mutationFn: (params: { id: string; enabled: boolean }) =>
      UpdateUserAPI({ id: params.id, enabled: params.enabled }, silentQueryRequest()),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orgUserQueryKeys.lists() });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => RemoveUserAPI(id, silentQueryRequest()),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orgUserQueryKeys.lists() });
    },
  });

  const resetFilter = () => {
    paging.condition.roleId = undefined;
    paging.condition.username = undefined;
    copyParams(currentNode, { name: undefined, id: undefined });
    fetchUserData();
  };

  const fetchUserData = (params?: PageChangeParams): void => {
    paging.fetchData(params);
  };

  const handleTreeNodeClick = (node: RoleTreeNodeVO): void => {
    copyParams(currentNode, node);
    paging.condition.roleId = node.id;
    fetchUserData();
  };

  const handleDeleteUser = (params: UserPageItemVO): void => {
    Confirm.warning(`是否删除用户(${params.username})`).then(() => {
      removeMutation.mutateAsync(params.userId).then(() => {
        Message.success("删除成功");
      });
    });
  };

  const handleDisableUser = (params: UserPageItemVO): void => {
    if (!params.userId || typeof params.enabled !== "boolean") {
      return;
    }
    const actionDesc = params.enabled ? "暂停账号" : "恢复账号";
    Confirm.warning(`是否${actionDesc}(${params.username})`).then(() => {
      void statusMutation.mutateAsync({ id: params.userId, enabled: !params.enabled }).then(() => {
        Message.success("操作成功");
      });
    });
  };

  return {
    loading: paging.fetching,
    condition: paging.condition,
    pageInfo: paging.pageInfo,
    currentNode,
    resetFilter,
    fetchUserData,
    handleTreeNodeClick,
    handleDeleteUser,
    handleDisableUser,
  };
};
