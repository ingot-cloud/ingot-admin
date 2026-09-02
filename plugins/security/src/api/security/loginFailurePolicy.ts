import { request } from "@ingot/admin-core";
import type { R, LoginFailureProtectionPolicyVO } from "@/models";

const PATH = "/api/security/platform/security/access/login-failure-policies";

export function GetLoginFailurePoliciesAPI(): Promise<
  R<Array<LoginFailureProtectionPolicyVO>>
> {
  return request.get<Array<LoginFailureProtectionPolicyVO>>(PATH);
}

export function GetLoginFailurePolicyByDimensionAPI(
  dimension: string,
): Promise<R<LoginFailureProtectionPolicyVO>> {
  return request.get<LoginFailureProtectionPolicyVO>(`${PATH}/${dimension}`);
}

export function UpdateLoginFailurePolicyAPI(
  policy: LoginFailureProtectionPolicyVO,
): Promise<R<void>> {
  return request.put<void>(PATH, policy);
}
