/// <reference types="vite/client" />
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
  readonly VITE_APP_AES: string;
  readonly VITE_APP_BUCKET_NAME: string;
  readonly VITE_APP_COPYRIGHT: string;
  readonly VITE_APP_LOGIN_CLIENT_ID: string;
  readonly VITE_APP_LOGIN_SCOPE: string;
  readonly VITE_APP_LOGIN_URI: string;
  readonly VITE_APP_LOGIN_CALLBACK_URI: string;
  readonly VITE_APP_ERROR_IMAGE: string;
  readonly VITE_APP_SETTINGS_COMPONENT_SIZE: string;
  readonly VITE_APP_SETTINGS_SHOW_MENU: boolean;
  readonly VITE_APP_SETTINGS_SHOW_TABS: boolean;
  readonly VITE_APP_SETTINGS_SHOW_BREADCRUMB: boolean;
  readonly VITE_APP_SETTINGS_SHOW_COPYRIGHT: boolean;
  readonly VITE_APP_SETTINGS_SHOW_SEARCH: boolean;
  readonly VITE_APP_SETTINGS_SHOW_WATERMARK: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
