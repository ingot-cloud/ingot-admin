import type {
  DeptTreeNode,
  PageChangeParams,
  UserPageItemVO,
  UserQueryDTO,
} from "@/models";
import { UpdateUserAPI, RemoveUserAPI } from "@/api/org/user";
import { OrgUserPageQueryOptions, orgUserQueryKeys } from "@/api/org/user.query";
import { Message, copyParams, silentQueryRequest, useServerPaging } from "@ingot/admin-core";
import { resolveOrgUserEnabledFilter, toOrgUserEnabledPickerValue } from "./table";
import { useMutation, useQueryClient } from "@tanstack/vue-query";

export const useUserOps = () => {
  const queryClient = useQueryClient();
  const paging = useServerPaging<UserPageItemVO, UserQueryDTO>({
    queryOptions: OrgUserPageQueryOptions,
  });
  const currentDeptNode = reactive<DeptTreeNode>({});

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

  const enabledFilter = computed({
    get: (): string | boolean => toOrgUserEnabledPickerValue(paging.condition.enabled),
    set: (value: string | number | boolean | null) => {
      paging.condition.enabled = resolveOrgUserEnabledFilter(value);
      fetchUserData();
    },
  });

  const resetFilter = () => {
    paging.condition.deptId = undefined;
    paging.condition.username = undefined;
    paging.condition.enabled = undefined;
    copyParams(currentDeptNode, { name: undefined, id: undefined });
    fetchUserData();
  };

  const fetchUserData = (params?: PageChangeParams): void => {
    paging.fetchData(params);
  };

  const handleTreeNodeClick = (node: DeptTreeNode): void => {
    copyParams(currentDeptNode, node);
    if (node.mainFlag) {
      paging.condition.deptId = undefined;
    } else {
      paging.condition.deptId = node.id;
    }
    fetchUserData();
  };

  const handleDeleteUser = (params: UserPageItemVO): void => {
    void removeMutation.mutateAsync(params.userId).then(() => {
      Message.success("删除成功");
    });
  };

  const handleDisableUser = (params: UserPageItemVO): void => {
    if (!params.userId || typeof params.enabled !== "boolean") {
      return;
    }
    void statusMutation.mutateAsync({ id: params.userId, enabled: !params.enabled }).then(() => {
      Message.success("操作成功");
    });
  };

  return {
    loading: paging.fetching,
    condition: paging.condition,
    enabledFilter,
    pageInfo: paging.pageInfo,
    currentDeptNode,
    resetFilter,
    fetchUserData,
    handleTreeNodeClick,
    handleDeleteUser,
    handleDisableUser,
  };
};
