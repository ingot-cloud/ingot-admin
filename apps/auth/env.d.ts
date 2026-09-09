/// <reference types="vite/client" />
declare module "virtual:iconify-offline";
declare module "virtual:ingot-iconify-icon" {
  import type { Component } from "vue";
  export const Icon: Component;
  export function loadIcon(name: string): Promise<{ body: string } | null>;
  export function getIcon(name: string): {
    body: string;
    width?: number;
    height?: number;
    left?: number;
    top?: number;
  } | null;
}
interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly VITE_APP_SYMBOL: string;
  readonly VITE_APP_STORE_PREFIX: string;
  readonly VITE_APP_COOKIE_DOMAIN: string;
  readonly VITE_APP_COOKIE_DEFAULT_EXPIRE_TIME: number;
  readonly VITE_APP_NET_BASE_URL: string;
  readonly VITE_APP_NET_DEFAULT_TIMEOUT: number;
  readonly VITE_APP_NET_DEFAULT_TIMEOUT_MESSAGE: string;
  readonly VITE_APP_BASIC_TOKEN: string;
  readonly VITE_APP_COPYRIGHT: string;
  readonly VITE_APP_LOGIN_BANNER: string;
  readonly VITE_APP_LOGIN_TITLE: string;
  readonly VITE_APP_LOGIN_DESC: string;
  readonly VITE_APP_FINGERPRINT_ENABLED: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
