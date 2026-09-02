import type { PageChangeParams, } from "@/models";
import { UserPageAPI, } from "@/api/platform/admin/user";

export const useOps = () => {
  const paging = usePaging(transformPageAPI(UserPageAPI));

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


  return {
    loading: paging.loading,
    condition: paging.condition,
    pageInfo: paging.pageInfo,
    resetFilter,
    fetchUserData,
  };
};
