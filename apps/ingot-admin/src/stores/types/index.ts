/**
 * 网络配置
 */
export interface NetConfig {
  baseURL?: string;
  timeout?: number;
  timeoutErrorMessage?: string;
}

/**
 * 登录页面相关配置
 */
export interface LoginConfig {
  /**
   * 登录地址
   */
  loginUri: string;
  /**
   * 登录回调地址
   */
  loginCallbackUri: string;
  /**
   * 登录失败图片
   */
  errorImage: string;
  /**
   * 指纹是否启用
   */
  fingerprintEnabled: boolean;
}

/**
 * App Store
 */
export interface AppStore {
  /**
   * 标题
   */
  title: string;
  /**
   * 版权
   */
  copyright: string;
  /**
   * 登录配置
   */
  login: LoginConfig;
  /**
   * 网络配置
   */
  netConfig: NetConfig;
  /**
   * basic token
   */
  basicToken: string;
  /**
   * Bucket Name
   */
  bucketName: string;
}

/**
 * Tab item
 */
export interface TabItem {
  title: string;
  path: string;
  close: boolean;
}
