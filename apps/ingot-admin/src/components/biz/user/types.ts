import type {
  R,
  AccountLockDTO
} from "@/models";

export type EnableAccountAPI = (id: string, reason?: string) => Promise<R<void>>;

export type DisableAccountAPI = (id: string, reason?: string) => Promise<R<void>>;

export type LockAccountAPI = (id: string, payload: AccountLockDTO) => Promise<R<void>>;

export type UnlockAccountAPI = (id: string, payload: AccountLockDTO) => Promise<R<void>>;
