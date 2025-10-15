import type { PageChangeParams, SysUser } from "@/models";
import { UserPageAPI, UpdateUserAPI } from "@/api/basic/user";

export const useOps = () => {
  const paging = usePaging(transformPageAPI(UserPageAPI));
  const confirmStatus = useConfirmStatus(transformUpdateAPI(UpdateUserAPI), paging.exec);

  /**
   * 重置过滤条件
   */
  const resetFilter = () => {
    paging.condition.phone = undefined;
    paging.condition.email = undefined;
    paging.condition.nickname = undefined;
    fetchUserData();
  };

  /**
   * 获取用户数据
   */
  const fetchUserData = (params?: PageChangeParams): void => {
    paging.exec(params);
  };

  /**
   * 禁用、启用
   */
  const handleDisableUser = (params: SysUser): void => {
    confirmStatus.exec(params.id!, params.status!, `用户(${params.nickname})`, "操作成功");
  };

  return {
    loading: paging.loading,
    condition: paging.condition,
    pageInfo: paging.pageInfo,
    resetFilter,
    fetchUserData,
    handleDisableUser,
  };
};
