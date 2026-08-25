export interface AccountLockoutPolicy {
  id?: number;
  userType: string;
  enabled: boolean;
  maxAttempts: number;
  lockDurationMinutes: number;
  attemptWindowMinutes: number;
  hintAfterAttempts: number;
  remark?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
