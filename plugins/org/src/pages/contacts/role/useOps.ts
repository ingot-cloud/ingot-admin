import type { UserDTO, PageChangeParams, RoleTreeNodeVO, UserPageItemVO, UserQueryDTO } from "@/models";
import type { CommonStatus } from "@/models/enums";
import { UpdateUserAPI, RemoveUserAPI } from "@/api/org/user";
import { OrgUserPageQueryOptions, orgUserQueryKeys } from "@/api/org/user.query";
import {
  Confirm,
  Message,
  copyParams,
  getCommonStatusActionDesc,
  getCommonStatusToggle,
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
    mutationFn: (params: { id: string; status: CommonStatus }) =>
      UpdateUserAPI({ id: params.id, status: params.status } as UserDTO, silentQueryRequest()),
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
    const next = getCommonStatusToggle(params.status!);
    Confirm.warning(`是否${getCommonStatusActionDesc(next)}用户(${params.username})`).then(() => {
      statusMutation.mutateAsync({ id: params.userId, status: next }).then(() => {
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
