import type { AuthorizationCandidateQuery, AuthorizationCandidatesApi } from "../models/iam";
import { IAM_DEFAULT_PAGE_SIZE } from "../models/iam";

type CandidateResponse = Awaited<ReturnType<AuthorizationCandidatesApi>>;

/** 同一个选择弹层内合并候选请求；关闭、依据或权限改变后必须 reset。 */
export function useIamCandidateRequests(api: () => AuthorizationCandidatesApi) {
  const pending = new Map<string, Promise<CandidateResponse>>();
  const completed = new Map<string, CandidateResponse>();
  let epoch = 0;

  const request: AuthorizationCandidatesApi = (query) => {
    const normalized: AuthorizationCandidateQuery = {
      kind: query.kind,
      delegationGrantId: query.delegationGrantId || undefined,
      revisionId: query.revisionId || undefined,
      parameterKey: query.parameterKey || undefined,
      actionId: query.actionId || undefined,
      applicationId: query.applicationId || undefined,
      keyword: query.keyword?.trim() || "",
      ids: query.ids ? [...new Set(query.ids)].sort() : undefined,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? IAM_DEFAULT_PAGE_SIZE,
    };
    const key = JSON.stringify(normalized);
    const cached = completed.get(key);
    if (cached) return Promise.resolve(cached);
    const running = pending.get(key);
    if (running) return running;
    const currentEpoch = epoch;
    const promise: Promise<CandidateResponse> = Promise.resolve()
      .then(() => api()(normalized))
      .then((response) => {
        if (epoch === currentEpoch) completed.set(key, response);
        return response;
      })
      .finally(() => {
        if (pending.get(key) === promise) pending.delete(key);
      });
    pending.set(key, promise);
    return promise;
  };

  const reset = (): void => {
    epoch += 1;
    pending.clear();
    completed.clear();
  };

  return { request, reset };
}
