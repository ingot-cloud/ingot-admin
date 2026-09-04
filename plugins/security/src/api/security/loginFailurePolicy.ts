import { request, type RequestOptions } from "@ingot/admin-core";
import type { R, LoginFailureProtectionPolicyVO } from "@/models";

const PATH = "/api/security/platform/security/access/login-failure-policies";

export function GetLoginFailurePoliciesAPI(
  options?: RequestOptions,
): Promise<R<Array<LoginFailureProtectionPolicyVO>>> {
  return request.get<Array<LoginFailureProtectionPolicyVO>>(PATH, undefined, options);
}

export function GetLoginFailurePolicyByDimensionAPI(
  dimension: string,
  options?: RequestOptions,
): Promise<R<LoginFailureProtectionPolicyVO>> {
  return request.get<LoginFailureProtectionPolicyVO>(`${PATH}/${dimension}`, undefined, options);
}

export function UpdateLoginFailurePolicyAPI(
  policy: LoginFailureProtectionPolicyVO,
  options?: RequestOptions,
): Promise<R<void>> {
  return request.put<void>(PATH, policy, options);
}
