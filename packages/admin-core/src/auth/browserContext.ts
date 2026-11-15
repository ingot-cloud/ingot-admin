import {
  createAuthApi,
  currentSessionContext,
  rememberSessionContext,
  type SessionMe,
} from "@ingot/auth-core";
import { Http } from "../net";
import { getAdminRuntimeConfig } from "../runtime";
import { pauseIdentityContext } from "../stores/modules/auth";

/** 验证宿主边界，先同步隔离旧界面，再发布实际Cookie对应的新版本。 */
export const adoptBrowserSession = (data: SessionMe): void => {
  const config = getAdminRuntimeConfig();
  if (
    data.appId !== config.login.appId ||
    data.domain !== config.login.expectedDomain ||
    (config.login.entry === "tenant" && !data.contextVersion)
  )
    throw new Error("当前登录身份与管理台不匹配");
  const previous = currentSessionContext();
  if (previous && previous !== data.contextVersion) pauseIdentityContext();
  rememberSessionContext(data);
};

let confirming: Promise<SessionMe> | undefined;
/** 并发首屏请求共用一次 me；登录身份只能从当前 Cookie 确认。 */
export const confirmBrowserSession = (): Promise<SessionMe> => {
  if (confirming) return confirming;
  const config = getAdminRuntimeConfig();
  confirming = createAuthApi(Http, config.login.entry)
    .me()
    .then(({ data }) => {
      adoptBrowserSession(data);
      return data;
    })
    .finally(() => {
      confirming = undefined;
    });
  return confirming;
};
