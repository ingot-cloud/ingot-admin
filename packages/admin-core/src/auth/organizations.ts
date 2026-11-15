import {
  createAuthApi,
  createOrganizationSwitchFlow,
  currentSessionContext,
  publishOrganizationSync,
  readOrganizationSync,
  rememberOrganizationSync,
  hasPendingOrganizationSwitch,
  isOwnOrganizationEvent,
  ORGANIZATION_CHANNEL,
  ORGANIZATION_SYNC_KEY,
  ORGANIZATION_SWITCH_PATH,
  type OrganizationSwitchView,
  type OrganizationSyncEvent,
  type SessionMe,
} from "@ingot/auth-core";
import { isApiError } from "@ingot/http-client";
import { Http } from "../net";
import { getAdminRuntimeConfig, getAdminRouter } from "../runtime";
import {
  beginIdentitySwitch,
  ensureSessionBootstrap,
  useAuthStore,
  usePermissions,
  useUserInfoStore,
} from "../stores/modules/auth";
import { useRouterStore } from "../stores/modules/router";
import type { MenuRouteRecord } from "../layouts";
import { PageName } from "../router/constants";
import { useLogin } from "../hooks/biz/useLogin";
import { Message } from "../utils/message";
import { adoptBrowserSession, confirmBrowserSession } from "./browserContext";

let entering: Promise<void> | undefined;
let reconciling: Promise<void> | undefined;
let enteredVersion: string | undefined;
let bound = false;

/** 按已授权菜单选择首页，绝不拼接原组织对象 ID。 */
export const organizationLandingPath = (menus: MenuRouteRecord[]): string => {
  let first: string | undefined;
  let workbench: string | undefined;
  const visit = (items: MenuRouteRecord[]): void => {
    for (const item of items) {
      if (item.children?.length) visit(item.children);
      else if (item.path && !item.path.includes(":")) {
        first ??= item.path;
        if (item.viewPath === "org.iam.workbench") workbench = item.path;
      }
    }
  };
  visit(menus);
  return workbench ?? first ?? "/403";
};

const navigateLanding = async (): Promise<void> => {
  const router = getAdminRouter();
  if (useUserInfoStore().getIsInitPwd) {
    await router.replace("/init");
    return;
  }
  const routes = useRouterStore();
  routes.installDynamicRoutes(router);
  if (router.hasRoute(PageName.DYNAMIC_ROUTE_BOOTSTRAP))
    router.removeRoute(PageName.DYNAMIC_ROUTE_BOOTSTRAP);
  await router.replace(organizationLandingPath(routes.getMenus));
};

const enter = (): Promise<void> => {
  if (entering) return entering;
  const version = currentSessionContext();
  if (version && version === enteredVersion && !useAuthStore().switchingIdentity)
    return Promise.resolve();
  entering = beginIdentitySwitch(navigateLanding, { feedback: "silent" })
    .then(() => {
      enteredVersion = version;
    })
    .catch(async (error: unknown) => {
      // 新身份已经建立，bootstrap 失败留在可重试页面，不能恢复旧组织。
      if (isApiError(error) && error.code === "IdentityInvalid") {
        await getAdminRouter().replace("/403");
        useAuthStore().switchingIdentity = false;
        return;
      }
      await getAdminRouter().replace(ORGANIZATION_SWITCH_PATH);
      throw error;
    })
    .finally(() => {
      entering = undefined;
    });
  return entering;
};

export const pauseOrganizationSwitch = (
  view: OrganizationSwitchView,
  sourceVersion: string,
): void => {
  if (currentSessionContext() && currentSessionContext() !== sourceVersion) return;
  publishOrganizationSync({
    phase: "pending",
    transactionId: view.transactionId,
    sourceVersion,
    expiresAt: view.expiresAt,
  });
  usePermissions().bumpContextEpoch();
  useAuthStore().switchingIdentity = true;
};

export const finishOrganizationSwitch = async (
  view: OrganizationSwitchView,
  identity: SessionMe,
): Promise<void> => {
  if (
    identity.appId !== "tenant-admin" ||
    identity.domain !== "TENANT" ||
    identity.tenantId !== view.tenantId ||
    identity.contextVersion !== view.transactionId
  )
    throw new Error("组织切换结果与当前登录身份不一致");
  const pending = readOrganizationSync();
  adoptBrowserSession(identity);
  if (pending?.phase !== "completed" || pending.transactionId !== view.transactionId)
    publishOrganizationSync({
      phase: "completed",
      transactionId: view.transactionId,
      sourceVersion: pending?.sourceVersion ?? "",
      expiresAt: view.recoveryExpiresAt ?? view.expiresAt,
    });
  await enter();
};

export const cancelOrganizationSwitch = async (): Promise<void> => {
  const before = currentSessionContext();
  const identity = await confirmBrowserSession();
  const event = readOrganizationSync();
  if (event?.phase === "pending" && identity.contextVersion === event.sourceVersion) {
    publishOrganizationSync({ ...event, phase: "cancelled" });
    useAuthStore().switchingIdentity = false;
  } else {
    if (event?.phase === "pending" && identity.contextVersion)
      publishOrganizationSync({
        phase: "completed",
        transactionId: identity.contextVersion,
        sourceVersion: event.sourceVersion,
        expiresAt: identity.expiresAt ?? event.expiresAt,
      });
    if (identity.contextVersion !== before || useAuthStore().switchingIdentity) await enter();
  }
};

/** 无候选返回不清理身份、不撤销会话，也不触发切换广播。 */
export const returnToCurrentOrganization = async (accessible: boolean): Promise<void> => {
  if (!accessible) {
    usePermissions().markUnavailable();
    await getAdminRouter().replace("/403");
    useAuthStore().switchingIdentity = false;
    return;
  }
  if (useAuthStore().switchingIdentity) {
    await enter();
    return;
  }
  await ensureSessionBootstrap({ feedback: "silent" });
  await navigateLanding();
};

/** 处理共享 Cookie 变化及旧请求失败，始终重验实际 me，不重放业务请求。 */
export const reconcileOrganizationContext = (reason?: string): Promise<void> => {
  if (reconciling) return reconciling;
  const before = currentSessionContext();
  reconciling = (async () => {
    const pending = readOrganizationSync();
    if (hasPendingOrganizationSwitch() && pending) {
      const flow = createOrganizationSwitchFlow(createAuthApi(Http, "tenant"), {
        onPending: () => undefined,
      });
      try {
        const result = await flow.restore(pending.transactionId);
        if (result) {
          await finishOrganizationSwitch(result.view, result.identity);
          return;
        }
      } catch {
        // 先确认 Cookie，不能让旧请求的 401 清掉已切换成功的新身份。
      }
    }
    try {
      const me = await confirmBrowserSession();
      if (me.contextVersion !== before || pending?.phase === "completed") {
        await enter();
        return;
      }
      if (reason === "IdentityInvalid" || hasPendingOrganizationSwitch()) {
        await getAdminRouter().replace(ORGANIZATION_SWITCH_PATH);
        return;
      }
      if (reason === "BFF_CONTEXT_CHANGED") {
        await enter();
        return;
      }
      await useLogin().go({ forceLogin: true });
    } catch (error) {
      if (isApiError(error) && error.status === 401) await useLogin().go({ forceLogin: true });
      else throw error;
    }
  })().finally(() => {
    reconciling = undefined;
  });
  return reconciling;
};

export const bindOrganizationChannel = (): void => {
  if (bound || getAdminRuntimeConfig().login.entry !== "tenant") return;
  bound = true;
  let pausedTransaction: string | undefined;
  const receive = (event: OrganizationSyncEvent): void => {
    if (!event || typeof event.transactionId !== "string") return;
    if (
      isOwnOrganizationEvent(event) ||
      useAuthStore().loggingOut ||
      /^\/login\/?$/.test(window.location.pathname)
    )
      return;
    if (event.phase === "pending" && Date.parse(event.expiresAt) > Date.now()) {
      if (currentSessionContext() && event.sourceVersion !== currentSessionContext()) return;
      rememberOrganizationSync(event);
      if (pausedTransaction === event.transactionId) return;
      pausedTransaction = event.transactionId;
      usePermissions().bumpContextEpoch();
      useAuthStore().switchingIdentity = true;
    } else if (event.phase === "cancelled") {
      rememberOrganizationSync(event);
      pausedTransaction = undefined;
      if (currentSessionContext() === event.sourceVersion) useAuthStore().switchingIdentity = false;
    } else if (event.phase === "completed") {
      rememberOrganizationSync(event);
      pausedTransaction = undefined;
      void reconcileOrganizationContext("BFF_CONTEXT_CHANGED").catch(() =>
        Message.warning("组织已变化，请重试加载当前组织"),
      );
    }
  };
  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel(ORGANIZATION_CHANNEL);
    channel.addEventListener("message", (event: MessageEvent<OrganizationSyncEvent>) =>
      receive(event.data),
    );
  }
  window.addEventListener("storage", (event) => {
    if (event.key !== ORGANIZATION_SYNC_KEY) return;
    const state = readOrganizationSync();
    if (state) receive(state);
  });
  const onVisible = (): void => {
    if (document.visibilityState !== "visible" || /^\/login\/?$/.test(window.location.pathname))
      return;
    const version = currentSessionContext();
    void confirmBrowserSession()
      .then((me) => {
        if (version && me.contextVersion !== version) return enter();
        const state = readOrganizationSync();
        if (state?.phase === "pending") receive(state);
      })
      .catch(() => undefined);
  };
  document.addEventListener("visibilitychange", onVisible);
  window.addEventListener("focus", onVisible);
};
