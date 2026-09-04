import { request, type RequestOptions } from "@ingot/admin-core";
import type { AccountLockoutPolicy, R } from "@/models";
import { filterParams } from "@ingot/admin-core";

const PATH = "/api/security/platform/security/account/lockout-policies";

export function GetAccountLockoutPoliciesAPI(
  options?: RequestOptions,
): Promise<R<Array<AccountLockoutPolicy>>> {
  return request.get<Array<AccountLockoutPolicy>>(PATH, undefined, options);
}

export function GetAccountLockoutPolicyByUserTypeAPI(
  userType: string,
  options?: RequestOptions,
): Promise<R<AccountLockoutPolicy | null>> {
  return request.get<AccountLockoutPolicy | null>(`${PATH}/${userType}`, undefined, options);
}

export function UpdateAccountLockoutPolicyAPI(
  policy: AccountLockoutPolicy,
  options?: RequestOptions,
): Promise<R<AccountLockoutPolicy>> {
  const params: AccountLockoutPolicy = {
    userType: policy.userType,
    enabled: policy.enabled,
    maxAttempts: policy.maxAttempts,
    lockDurationMinutes: policy.lockDurationMinutes,
    attemptWindowMinutes: policy.attemptWindowMinutes,
    hintAfterAttempts: policy.hintAfterAttempts,
    remark: policy.remark ?? null,
  };
  filterParams(params);
  return request.put<AccountLockoutPolicy>(PATH, params, options);
}
