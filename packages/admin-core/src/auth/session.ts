import { createAuthApi, takeReturnTo, type AuthSession, type SessionMe } from "@ingot/auth-core";
import logoUrl from "@ingot/appearance/assets/logo/in-light-framed.svg";
import logoDarkUrl from "@ingot/appearance/assets/logo/in-dark-framed.svg";
import { Http } from "../net";
import { getAdminRuntimeConfig, getAdminRouter } from "../runtime";
import {
  beginIdentitySwitch,
  bindIdentityChannel,
  DomainMismatchError,
  publishIdentityInvalidated,
  useAuthStore,
  useUserInfoStore,
} from "../stores/modules/auth";
import { useRouterStore } from "../stores/modules/router";
import { PageName } from "../router/constants";
import { Message } from "../utils/message";
import { isApiError } from "@ingot/http-client";

/** 为同源登录插件提供管理宿主能力，不依赖业务插件实现。 */
export const createSameOriginAuthSession = (): AuthSession => {
  const config = getAdminRuntimeConfig();
  bindIdentityChannel();
  const api = createAuthApi(Http, config.login.entry);
  const validate = (me: SessionMe): void => {
    if (me.appId !== config.login.appId || me.domain !== config.login.expectedDomain)
      throw new DomainMismatchError(config.login.expectedDomain, me.domain);
  };
  let entering: Promise<void> | undefined;
  let existing: Promise<boolean> | undefined;
  let notifiedTransaction: string | undefined;
  const enter = (): Promise<void> => {
    if (entering) return entering;
    if (useAuthStore().loggingOut) return Promise.resolve();
    entering = beginIdentitySwitch(async () => {
      const router = getAdminRouter();
      const mustChangePassword = useUserInfoStore().getIsInitPwd;
      if (!mustChangePassword) {
        useRouterStore().installDynamicRoutes(router);
        if (router.hasRoute(PageName.DYNAMIC_ROUTE_BOOTSTRAP))
          router.removeRoute(PageName.DYNAMIC_ROUTE_BOOTSTRAP);
      }
      const target = mustChangePassword
        ? "/init"
        : (takeReturnTo(undefined, config.login.appId) ?? "/");
      await router.replace(target);
    }).finally(() => {
      entering = undefined;
    });
    return entering;
  };
  return {
    appId: config.login.appId,
    entry: config.login.entry,
    includeTenantSelect: config.login.entry === "tenant",
    appearance: {
      title: config.login.title || config.branding.title,
      desc: config.login.desc,
      copyright: config.branding.copyright.replace("{0}", String(new Date().getFullYear())),
      loginBanner: "",
      errorImage: config.login.errorImage,
    },
    logoUrl,
    logoDarkUrl,
    colorScheme: config.login.colorScheme,
    api,
    onAuthenticated: async (result, identity) => {
      validate(identity);
      if (notifiedTransaction !== result.transactionId) {
        notifiedTransaction = result.transactionId;
        publishIdentityInvalidated();
      }
      await enter();
    },
    onExistingSession: () => {
      if (existing) return existing;
      existing = (async () => {
        let me: SessionMe;
        try {
          me = (await api.me()).data;
        } catch (error) {
          if (isApiError(error) && (error.status === 401 || error.code === "S0401")) return false;
          throw error;
        }
        validate(me);
        await enter();
        return true;
      })().finally(() => {
        existing = undefined;
      });
      return existing;
    },
    warn: (message) => Message.warning(message, { showClose: true }),
  };
};
