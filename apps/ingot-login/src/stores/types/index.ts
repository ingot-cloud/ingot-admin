/**
 * 登录页面相关配置
 */
export interface LoginConfig {
  /**
   * 版权
   */
  copyright: string;
  /**
   * 登录banner
   */
  loginBanner: string;
  /**
   * error 图片
   */
  errorImage: string;
  /**
   * 登录title
   */
  title: string;
  /**
   * 二维码title
   */
  qrcodeTitle: string;
  /**
   * 登录描述
   */
  desc: string;
}

export interface RequiredParameters {
  pre_grant_type?: string;
  client_id?: string;
  code_challenge?: string;
  response_type?: string;
  redirect_uri?: string;
  scope?: string;
  state?: string;
}
