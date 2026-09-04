import type { PageChangeParams, PlatformSessionVO, PlatformSessionQueryDTO } from "@/models";
import { useMutation, useQueryClient } from "@tanstack/vue-query";
import {
  invalidateQueriesByKeys,
  silentQueryRequest,
  useServerPaging,
} from "@ingot/admin-core";
import {
  hasSessionQueryConstraint,
  SessionPageQueryOptions,
  sessionQueryKeys,
} from "@/api/security/session.query";
import { RevokeSessionBySidAPI, RevokeSessionsByUserAPI } from "@/api/security/session";
import { displaySessionUser } from "./sessionDisplay";

export const useOps = () => {
  const queryClient = useQueryClient();
  const paging = useServerPaging<PlatformSessionVO, PlatformSessionQueryDTO>({
    queryOptions: SessionPageQueryOptions,
    queryWhen: hasSessionQueryConstraint,
  });
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
    paging.resetSubmitted({
      tenantId: undefined,
      clientId: undefined,
      userId: undefined,
      ipAddress: undefined,
    });
  };

  const fetchData = (params?: PageChangeParams): void => {
    if (!params && !canQuery()) {
      return;
    }
    paging.fetchData(params);
  };

  const revokeBySidMutation = useMutation({
    mutationFn: (sid: string) =>
      RevokeSessionBySidAPI(sid, silentQueryRequest()).then(({ data }) => data),
    onSuccess: (_online, sid) => {
      void invalidateQueriesByKeys(queryClient, [sessionQueryKeys.lists(), sessionQueryKeys.detail(sid)]);
    },
  });

  const revokeByUserMutation = useMutation({
    mutationFn: (vars: { userId: string | number; clientId?: string; tenantId?: string | number }) =>
      RevokeSessionsByUserAPI(vars, silentQueryRequest()).then(({ data }) => data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: sessionQueryKeys.lists() });
    },
  });

  const revokeBySid = (session: PlatformSessionVO): void => {
    if (!session.sid) {
      return;
    }
    confirm.warning(`是否强制下线会话(${session.sid})?`).then(() => {
      revokeBySidMutation.mutateAsync(session.sid!).then((online) => {
        if (online === false) {
          message.warning("会话已不在线");
        } else {
          message.success("操作成功");
        }
      });
    });
  };

  const revokeByUser = (session: PlatformSessionVO): void => {
    if (session.userId === undefined || session.userId === null || session.userId === "") {
      return;
    }
    const name = displaySessionUser(session);
    confirm.warning(`是否强制下线用户(${name})的会话?`).then(() => {
      revokeByUserMutation
        .mutateAsync({
          userId: session.userId!,
          clientId: paging.condition.clientId,
          tenantId: paging.condition.tenantId ?? session.tenantId,
        })
        .then((count) => {
          message.success(`已下线 ${count ?? 0} 个会话`);
        });
    });
  };

  return {
    loading: paging.fetching,
    condition: paging.condition,
    pageInfo: paging.pageInfo,
    isClientOnlyQuery,
    resetFilter,
    fetchData,
    revokeBySid,
    revokeByUser,
  };
};
