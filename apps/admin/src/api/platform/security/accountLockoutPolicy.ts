import { Http as request } from "@ingot/admin-core";
import type { AccountLockoutPolicy, R } from "@base/models";
import { filterParams } from "@ingot/admin-core";

const PATH = "/api/security/platform/security/account/lockout-policies";

export function GetAccountLockoutPoliciesAPI(): Promise<R<Array<AccountLockoutPolicy>>> {
  return request.get<Array<AccountLockoutPolicy>>(PATH);
}

export function GetAccountLockoutPolicyByUserTypeAPI(
  userType: string,
): Promise<R<AccountLockoutPolicy | null>> {
  return request.get<AccountLockoutPolicy | null>(`${PATH}/${userType}`);
}

export function UpdateAccountLockoutPolicyAPI(
  policy: AccountLockoutPolicy,
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
  return request.put<AccountLockoutPolicy>(PATH, params);
}
