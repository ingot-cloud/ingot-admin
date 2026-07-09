import { importRsaPublicKey } from "./rsa-oaep";
import type { PublicKeyInfo } from "./types";

/**
 * 公钥拉取函数，由各应用注入（复用各自的 Http 实例调用 GET /crypto/public-keys）
 */
export type PublicKeyFetcher = () => Promise<PublicKeyInfo[]>;

/**
 * 可注入的存储适配器（默认 sessionStorage）
 */
export interface KeyStoreStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * KeyStore 配置项
 */
export interface KeyStoreOptions {
  fetcher: PublicKeyFetcher;
  /** 传入则启用 sessionStorage 持久化，刷新页面后可复用公钥 */
  storageKey?: string;
  storage?: KeyStoreStorage;
}

/** 默认 sessionStorage 键名 */
export const DEFAULT_PUBLIC_KEY_STORAGE_KEY = "ingot:crypto:public-key";

/**
 * sessionStorage 中持久化的公钥结构（仅存 X509 Base64，不存 CryptoKey）
 */
interface PersistedPublicKey {
  kid: string;
  publicKey: string;
  alg: string;
}

/**
 * 缓存中的活跃公钥
 */
export interface ActiveKey {
  kid: string;
  publicKey: CryptoKey;
}

/**
 * 公钥缓存与轮换管理，支持可选的 sessionStorage 持久化（各子域独立缓存）
 */
export class KeyStore {
  private readonly fetcher: PublicKeyFetcher;
  private readonly storageKey?: string;
  private readonly storage?: KeyStoreStorage;
  private active?: ActiveKey;
  private pending?: Promise<ActiveKey>;

  constructor(fetcher: PublicKeyFetcher);
  constructor(options: KeyStoreOptions);
  constructor(fetcherOrOptions: PublicKeyFetcher | KeyStoreOptions) {
    if (typeof fetcherOrOptions === "function") {
      this.fetcher = fetcherOrOptions;
      return;
    }
    this.fetcher = fetcherOrOptions.fetcher;
    this.storageKey = fetcherOrOptions.storageKey;
    this.storage = fetcherOrOptions.storage;
  }

  /**
   * 获取当前活跃公钥：内存 -> sessionStorage -> 网络拉取
   */
  async getActiveKey(): Promise<ActiveKey> {
    if (this.active) {
      return this.active;
    }
    return this.load();
  }

  /**
   * 读取当前缓存的活跃 kid（未加载时为 undefined）
   */
  getActiveKid(): string | undefined {
    return this.active?.kid;
  }

  /**
   * 强制刷新公钥缓存：清除内存与 sessionStorage，从网络重新拉取
   */
  async refresh(): Promise<ActiveKey> {
    this.active = undefined;
    this.clearPersisted();
    if (this.pending) {
      await this.pending.catch(() => undefined);
    }
    this.pending = this.fetchActive().finally(() => {
      this.pending = undefined;
    });
    return this.pending;
  }

  private clearPersisted(): void {
    const storage = this.resolveStorage();
    if (storage && this.storageKey) {
      storage.removeItem(this.storageKey);
    }
  }

  private load(): Promise<ActiveKey> {
    if (this.pending) {
      return this.pending;
    }
    this.pending = this.resolveActive().finally(() => {
      this.pending = undefined;
    });
    return this.pending;
  }

  private async resolveActive(): Promise<ActiveKey> {
    const cached = await this.readPersisted();
    if (cached) {
      this.active = cached;
      return cached;
    }
    return this.fetchActive();
  }

  private async readPersisted(): Promise<ActiveKey | undefined> {
    const storage = this.resolveStorage();
    if (!storage || !this.storageKey) {
      return undefined;
    }
    const raw = storage.getItem(this.storageKey);
    if (!raw) {
      return undefined;
    }
    try {
      const parsed = JSON.parse(raw) as PersistedPublicKey;
      if (!parsed.kid || !parsed.publicKey) {
        storage.removeItem(this.storageKey);
        return undefined;
      }
      const publicKey = await importRsaPublicKey(parsed.publicKey);
      return { kid: parsed.kid, publicKey };
    } catch {
      storage.removeItem(this.storageKey);
      return undefined;
    }
  }

  private persist(info: PublicKeyInfo): void {
    const storage = this.resolveStorage();
    if (!storage || !this.storageKey) {
      return;
    }
    const payload: PersistedPublicKey = {
      kid: info.kid,
      publicKey: info.publicKey,
      alg: info.alg,
    };
    storage.setItem(this.storageKey, JSON.stringify(payload));
  }

  private resolveStorage(): KeyStoreStorage | undefined {
    if (!this.storageKey) {
      return undefined;
    }
    if (this.storage) {
      return this.storage;
    }
    if (typeof sessionStorage !== "undefined") {
      return sessionStorage;
    }
    return undefined;
  }

  private async fetchActive(): Promise<ActiveKey> {
    const keys = await this.fetcher();
    const target = keys.find((item) => item.active) ?? keys[0];
    if (!target) {
      throw new Error("未获取到可用的服务端公钥");
    }
    const publicKey = await importRsaPublicKey(target.publicKey);
    this.active = { kid: target.kid, publicKey };
    this.persist(target);
    return this.active;
  }
}
