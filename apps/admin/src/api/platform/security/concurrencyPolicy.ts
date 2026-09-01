import { Http as request } from "@ingot/admin-core";
import type { R, SessionConcurrencyPolicy } from "@base/models";

const PATH = "/api/security/platform/security/session/concurrency-policies";

export function GetConcurrencyPoliciesAPI(): Promise<R<Array<SessionConcurrencyPolicy>>> {
  return request.get<Array<SessionConcurrencyPolicy>>(PATH);
}

export function GetConcurrencyPolicyAPI(id: number): Promise<R<SessionConcurrencyPolicy>> {
  return request.get<SessionConcurrencyPolicy>(`${PATH}/${id}`);
}

export function CreateConcurrencyPolicyAPI(
  policy: SessionConcurrencyPolicy,
): Promise<R<SessionConcurrencyPolicy>> {
  return request.post<SessionConcurrencyPolicy>(PATH, policy);
}

export function UpdateConcurrencyPolicyAPI(
  policy: SessionConcurrencyPolicy,
): Promise<R<SessionConcurrencyPolicy>> {
  return request.put<SessionConcurrencyPolicy>(PATH, policy);
}

export function DeleteConcurrencyPolicyAPI(id: number): Promise<R<void>> {
  return request.delete<void>(`${PATH}/${id}`);
}
