import request from "@/net";
import type {
  R,
  CredentialPolicyConfig,
} from "@/models";

const PATH = "/api/security/platform/security/credential/policy-config";

export function GetPolicyConfig(policyType: string) {
  return request.get<CredentialPolicyConfig>(`${PATH}/${policyType}`);
}

export function GetPolicyConfigList() {
  return request.get<Array<CredentialPolicyConfig>>(`${PATH}/list`);
}

export function CreatePolicyConfig(policyConfig: CredentialPolicyConfig) {
  return request.post<void>(`${PATH}`, policyConfig);
}

export function UpdatePolicyConfig(policyConfig: CredentialPolicyConfig) {
  return request.put<void>(`${PATH}`, policyConfig);
}

export function DeletePolicyConfig(id: string) {
  return request.delete<void>(`${PATH}/${id}`);
}
