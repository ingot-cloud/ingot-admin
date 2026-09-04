import { request, type RequestOptions } from "@ingot/admin-core";
import type { R, SessionConcurrencyPolicy } from "@/models";

const PATH = "/api/security/platform/security/session/concurrency-policies";

export function GetConcurrencyPoliciesAPI(
  options?: RequestOptions,
): Promise<R<Array<SessionConcurrencyPolicy>>> {
  return request.get<Array<SessionConcurrencyPolicy>>(PATH, undefined, options);
}

export function GetConcurrencyPolicyAPI(
  id: number,
  options?: RequestOptions,
): Promise<R<SessionConcurrencyPolicy>> {
  return request.get<SessionConcurrencyPolicy>(`${PATH}/${id}`, undefined, options);
}

export function CreateConcurrencyPolicyAPI(
  policy: SessionConcurrencyPolicy,
  options?: RequestOptions,
): Promise<R<SessionConcurrencyPolicy>> {
  return request.post<SessionConcurrencyPolicy>(PATH, policy, options);
}

export function UpdateConcurrencyPolicyAPI(
  policy: SessionConcurrencyPolicy,
  options?: RequestOptions,
): Promise<R<SessionConcurrencyPolicy>> {
  return request.put<SessionConcurrencyPolicy>(PATH, policy, options);
}

export function DeleteConcurrencyPolicyAPI(id: number, options?: RequestOptions): Promise<R<void>> {
  return request.delete<void>(`${PATH}/${id}`, null, options);
}
