export interface CredentialPolicyConfig {
  id?: string;
  policyType?: string;
  policyConfig: Record<string, any>;
  priority?: number;
  enabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
