import type { RoleGroupItemVO, PageChangeParams, UserPageItemVO } from "@/models";
import { UserPageAPI, UpdateUserAPI, RemoveUserAPI } from "@/api/org/user";
import { copyParams } from "@/utils/object";

export const useUserOps = () => {
  const paging = usePaging(transformPageAPI(UserPageAPI));
  const confirmStatus = useConfirmStatus(transformUpdateAPI(UpdateUserAPI), paging.exec);
  const confirmDelete = useConfirmDelete(transformDeleteAPI(RemoveUserAPI), paging.exec);
  const currentNode = reactive<RoleGroupItemVO>({});

  /**
   * 重置过滤条件
   */
  const resetFilter = () => {
    paging.condition.roleId = undefined;
    paging.condition.username = undefined;
    copyParams(currentNode, { name: undefined, id: undefined });
    fetchUserData();
  };

  /**
   * 获取用户数据
   */
  const fetchUserData = (params?: PageChangeParams): void => {
    paging.exec(params);
  };

  /**
   * 处理节点点击事件
   * @param node 角色树节点
   */
  const handleTreeNodeClick = (node: RoleGroupItemVO): void => {
    copyParams(currentNode, node);
    paging.condition.roleId = node.id;
    fetchUserData();
  };

  /**
   * 删除用户
   */
  const handleDeleteUser = (params: UserPageItemVO): void => {
    confirmDelete.exec(params.userId, `是否删除用户(${params.username})`, "删除成功");
  };

  /**
   * 禁用、启用
   */
  const handleDisableUser = (params: UserPageItemVO): void => {
    confirmStatus.exec(params.userId, params.status!, `用户(${params.username})`, "操作成功");
  };

  return {
    loading: paging.loading,
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
