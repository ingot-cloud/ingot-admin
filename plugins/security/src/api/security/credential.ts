import { request, type RequestOptions } from "@ingot/admin-core";
import type { R, CredentialPolicyConfig } from "@/models";

const PATH = "/api/security/platform/security/credential/policy-config";

export function GetPolicyConfig(
  policyType: string,
  options?: RequestOptions,
): Promise<R<CredentialPolicyConfig>> {
  return request.get<CredentialPolicyConfig>(`${PATH}/${policyType}`, undefined, options);
}

export function GetPolicyConfigList(
  options?: RequestOptions,
): Promise<R<Array<CredentialPolicyConfig>>> {
  return request.get<Array<CredentialPolicyConfig>>(`${PATH}/list`, undefined, options);
}

export function CreatePolicyConfig(
  policyConfig: CredentialPolicyConfig,
  options?: RequestOptions,
): Promise<R<void>> {
  return request.post<void>(`${PATH}`, policyConfig, options);
}

export function UpdatePolicyConfig(
  policyConfig: CredentialPolicyConfig,
  options?: RequestOptions,
): Promise<R<void>> {
  return request.put<void>(`${PATH}`, policyConfig, options);
}

export function DeletePolicyConfig(id: string, options?: RequestOptions): Promise<R<void>> {
  return request.delete<void>(`${PATH}/${id}`, null, options);
}
