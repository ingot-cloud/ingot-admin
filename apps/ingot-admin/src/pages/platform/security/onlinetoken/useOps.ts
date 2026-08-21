import type { PageChangeParams, PlatformSessionVO, PlatformSessionQueryDTO } from "@/models";
import {
  SessionPageAPI,
  RevokeSessionBySidAPI,
  RevokeSessionsByUserAPI,
} from "@/api/platform/security/session";
import { displaySessionUser } from "./sessionDisplay";

export const useOps = () => {
  const paging = usePaging<PlatformSessionVO, PlatformSessionQueryDTO>(
    transformPageAPI(SessionPageAPI),
  );
  const message = useMessage();
  const confirm = useMessageConfirm();

  const isClientOnlyQuery = computed(
    () =>
      Boolean(paging.condition.clientId) && !paging.condition.userId && !paging.condition.ipAddress,
  );

  const canQuery = (): boolean => {
    if (!paging.condition.clientId && !paging.condition.userId) {
      message.warning("查询在线会话必须指定客户端或用户 ID");
      return false;
    }
    if (paging.condition.ipAddress && !paging.condition.clientId) {
      message.warning("按登录 IP 过滤时必须同时选择客户端");
      return false;
    }
    return true;
  };

  const resetFilter = (): void => {
    paging.condition.tenantId = undefined;
    paging.condition.clientId = undefined;
    paging.condition.userId = undefined;
    paging.condition.ipAddress = undefined;
    paging.pageInfo.records = [];
    paging.pageInfo.total = 0;
  };

  const fetchData = (params?: PageChangeParams): void => {
    if (!canQuery()) {
      return;
    }
    paging.exec(params);
  };

  const revokeBySid = (session: PlatformSessionVO): void => {
    if (!session.sid) {
      return;
    }
    confirm.warning(`是否强制下线会话(${session.sid})?`).then(() => {
      RevokeSessionBySidAPI(session.sid!).then((response) => {
        if (response.data === false) {
          message.warning("会话已不在线");
        } else {
          message.success("操作成功");
        }
        fetchData();
      });
    });
  };

  const revokeByUser = (session: PlatformSessionVO): void => {
    if (session.userId === undefined || session.userId === null || session.userId === "") {
      return;
    }
    const name = displaySessionUser(session);
    confirm.warning(`是否强制下线用户(${name})的会话?`).then(() => {
      RevokeSessionsByUserAPI({
        userId: session.userId,
        clientId: paging.condition.clientId,
        tenantId: paging.condition.tenantId ?? session.tenantId,
      }).then((response) => {
        message.success(`已下线 ${response.data ?? 0} 个会话`);
        fetchData();
      });
    });
  };

  return {
    loading: paging.loading,
    condition: paging.condition,
    pageInfo: paging.pageInfo,
    isClientOnlyQuery,
    resetFilter,
    fetchData,
    revokeBySid,
    revokeByUser,
  };
};
