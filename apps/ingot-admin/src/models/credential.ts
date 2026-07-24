export interface CredentialPolicyConfig {
  id?: string;
  policyType?: string;
  policyConfig: Record<string, any>;
  priority?: number;
  enabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface InitialPasswordPolicyConfig {
  generation: string;
  length?: number;
  fixedPassword?: string;
  validHours: number;
  oneTime: boolean;
  forceChangeOnFirstLogin: boolean;
}
