import type { UserInfo, UserEffectivePermissionVO } from "@/models/security";
import type {
  IamBootstrap,
  CurrentCapabilities,
  AuthorizationDomain,
  IamApplicationSummary,
  PasswordChangeState,
} from "@/models/iam";
import { PasswordChangeStateAPI } from "@/api/common/password";
import { StatusCode } from "@/net/status-code";
import { ApiError, type RequestOptions } from "@ingot/http-client";
import { LogoutAPI } from "@/api/common/auth";
import { IamBootstrapAPI, IamCapabilitiesAPI } from "@/api/common/iam";
import { mapIamMenus } from "@/router/helper/iamMenus";
import { clearAdminQueryCache } from "@/query/client";
import { getAdminRuntimeConfig, getAdminRouter } from "@/runtime";
import { useLogin } from "@/hooks/biz/useLogin";
import { PageName } from "@/router/constants";
import { useRouterStore } from "./router";

export class DomainMismatchError extends Error {
  readonly name = "DomainMismatchError";

  constructor(
    readonly expected: AuthorizationDomain,
    readonly actual: string | undefined,
  ) {
    super("当前身份不属于本管理台");
  }
}

const emptyUserInfo = (): UserInfo => ({
  user: undefined,
  roles: [],
  allows: [],
  mustChangePwd: false,
  memberId: undefined,
  accountId: undefined,
  domain: undefined,
  tenantId: undefined,
});

const toUserInfo = (bootstrap: IamBootstrap): UserInfo => ({
  user: {
    nickname: bootstrap.profile.displayName,
    avatar: bootstrap.profile.avatar,
  },
  roles: [],
  allows: [],
  // 必须改密的账号无法取得业务 bootstrap，只能使用 PasswordChangeState。
  mustChangePwd: false,
  memberId: bootstrap.profile.memberId,
  accountId: bootstrap.context.accountId,
  domain: bootstrap.context.domain,
  tenantId: bootstrap.context.tenantId ?? null,
});

/**
 * 授权信息
 */
export const useAuthStore = defineStore(
  "security",
  () => {
    const loggingOut = ref(false);
    const switchingIdentity = ref(false);
    const isTransitioning = computed(() => loggingOut.value || switchingIdentity.value);
    let logoutPromise: Promise<void> | undefined;
    const LOGOUT_TIMEOUT_MILLIS = 1500;

    /** 退出仅执行一次；本地401不撤销远端，显式退出超时中止旧请求。 */
    const logout = (ignoreRevokeAPI?: boolean): Promise<void> => {
      if (logoutPromise) return logoutPromise;
      loggingOut.value = true;
      clearIdentityContext();
      let revoke = Promise.resolve();
      if (!ignoreRevokeAPI) {
        const controller = new AbortController();
        let timeout: ReturnType<typeof setTimeout> | undefined;
        revoke = Promise.race([
          LogoutAPI(controller.signal).then(
            () => undefined,
            () => undefined,
          ),
          new Promise<void>((resolve) => {
            timeout = setTimeout(() => {
              controller.abort();
              resolve();
            }, LOGOUT_TIMEOUT_MILLIS);
          }),
        ]).finally(() => clearTimeout(timeout));
      }
      logoutPromise = revoke.then(() => publishIdentityLoggedOut());
      return logoutPromise;
    };

    return { logout, loggingOut, switchingIdentity, isTransitioning };
  },
  {
    persist: {
      storage: localStorage,
      pick: ["token"],
    },
  },
);

/**
 * 用户信息
 */
export const useUserInfoStore = defineStore("security.user", () => {
  const permissions = usePermissions();

  const userInfo = reactive<UserInfo>(emptyUserInfo());

  const getUsername = computed(() => {
    return userInfo.user ? userInfo.user.nickname : "未登录";
  });
  const getSensitivePhone = computed(() => {
    return userInfo.user
      ? `${userInfo.user.phone?.slice(0, 3)}****${userInfo.user.phone?.slice(-4)}`
      : "";
  });
  const getAvatar = computed(() => {
    return userInfo.user ? userInfo.user.avatar : "";
  });
  const getRoles = computed(() => userInfo.roles);
  const getAllows = computed(() => userInfo.allows);
  const getCurrentOrg = computed(() => userInfo.allows.find((item) => item.main));
  const getUserInfoWhetherExist = computed(() => Boolean(userInfo.memberId));
  const getIsInitPwd = computed(() => {
    return userInfo.mustChangePwd;
  });
  const getIsSystemAdmin = computed(() => false);
  const clear = () => {
    Object.assign(userInfo, emptyUserInfo());
  };

  const applyUserInfo = (data: UserInfo): void => {
    Object.assign(userInfo, data);
    permissions.updateRoles(data.roles);
  };

  const fetchUserInfo = (): Promise<UserInfo> => {
    return ensureSessionBootstrap().then(() => useUserInfoStore().userInfo);
  };

  return {
    userInfo,
    getUsername,
    getSensitivePhone,
    getAvatar,
    getRoles,
    getUserInfoWhetherExist,
    getAllows,
    getCurrentOrg,
    getIsInitPwd,
    getIsSystemAdmin,
    clear,
    applyUserInfo,
    fetchUserInfo,
  };
});

export const usePermissions = defineStore("security.permissions", () => {
  const roles = ref<Array<string>>([]);
  const permissions = ref<Array<string>>([]);
  const version = ref<string>();
  const generatedAt = ref<string>();
  const expiresAt = ref<string>();
  const contextEpoch = ref(0);
  const unavailable = ref(false);
  const domain = ref<string>();
  const tenantId = ref<string | null>();
  const memberId = ref<string>();
  const accountId = ref<string>();
  const applications = ref<IamApplicationSummary[]>([]);
  const tenantOwner = ref(false);

  const updateRoles = (params: Array<string>) => {
    roles.value = params;
  };

  const applyEffectivePermissions = (data: UserEffectivePermissionVO): void => {
    permissions.value = data.permissions ?? [];
    version.value = data.version !== undefined ? String(data.version) : undefined;
    generatedAt.value = data.generatedAt;
    expiresAt.value = data.expiresAt;
    unavailable.value = false;
  };

  const applyCapabilities = (data: CurrentCapabilities): void => {
    permissions.value = data.actionCodes ?? [];
    version.value = data.version;
    expiresAt.value = data.expiresAt;
    unavailable.value = false;
  };

  const markUnavailable = (): void => {
    unavailable.value = true;
  };

  const bumpContextEpoch = (): number => {
    contextEpoch.value += 1;
    return contextEpoch.value;
  };

  const applyContext = (bootstrap: IamBootstrap): void => {
    tenantOwner.value = bootstrap.context.domain === "TENANT" && bootstrap.tenantOwner === true;
    domain.value = bootstrap.context.domain;
    tenantId.value = bootstrap.context.tenantId ?? null;
    memberId.value = bootstrap.context.memberId;
    accountId.value = bootstrap.context.accountId;
    applications.value = bootstrap.applications.map((item) => ({ ...item }));
  };

  const clear = (): void => {
    roles.value = [];
    permissions.value = [];
    version.value = undefined;
    generatedAt.value = undefined;
    expiresAt.value = undefined;
    tenantOwner.value = false;
    unavailable.value = false;
    domain.value = undefined;
    tenantId.value = undefined;
    memberId.value = undefined;
    accountId.value = undefined;
    applications.value = [];
  };

  return {
    roles,
    permissions,
    version,
    generatedAt,
    expiresAt,
    contextEpoch,
    unavailable,
    domain,
    tenantId,
    memberId,
    accountId,
    applications,
    tenantOwner,
    updateRoles,
    applyEffectivePermissions,
    applyCapabilities,
    markUnavailable,
    bumpContextEpoch,
    applyContext,
    clear,
  };
});

let bootstrapPromise: Promise<void> | undefined;
let bootstrapped = false;
let visibilityBound = false;
let identityChannelBound = false;
let refreshPromise: Promise<void> | undefined;

const IDENTITY_CHANNEL_NAME = "ingot:identity";
const IDENTITY_SOURCE_ID = crypto.randomUUID();

type IdentityEventType = "invalidated" | "logged-out";

const publishIdentityEvent = (type: IdentityEventType): void => {
  if (typeof BroadcastChannel === "undefined") return;
  const channel = new BroadcastChannel(IDENTITY_CHANNEL_NAME);
  channel.postMessage({ type, source: IDENTITY_SOURCE_ID });
  channel.close();
};

export const publishIdentityInvalidated = (): void => publishIdentityEvent("invalidated");
const publishIdentityLoggedOut = (): void => publishIdentityEvent("logged-out");

let identityTransitionVersion = 0;

function clearIdentityContext(): number {
  const transition = ++identityTransitionVersion;
  usePermissions().bumpContextEpoch();
  resetSessionBootstrap();
  useRouterStore().clearForPasswordChange();
  useUserInfoStore().clear();
  usePermissions().clear();
  clearAdminQueryCache();
  return transition;
}

export const bindIdentityChannel = (): void => {
  if (identityChannelBound || typeof BroadcastChannel === "undefined") return;
  identityChannelBound = true;
  const channel = new BroadcastChannel(IDENTITY_CHANNEL_NAME);
  channel.addEventListener(
    "message",
    (event: MessageEvent<{ type?: IdentityEventType; source?: string }>) => {
      if (event.data?.source === IDENTITY_SOURCE_ID) return;
      if (event.data?.type === "logged-out") {
        useAuthStore().loggingOut = true;
        clearIdentityContext();
        void useLogin().go({ rememberReturnTo: false });
        return;
      }
      if (event.data?.type !== "invalidated" || useAuthStore().loggingOut) return;
      if (/^\/login\/?$/.test(window.location.pathname)) {
        clearIdentityContext();
        return;
      }
      void beginIdentitySwitch(async () => {
        const router = getAdminRouter();
        const store = useRouterStore();
        if (useUserInfoStore().getIsInitPwd) {
          await router.replace("/init");
        } else {
          store.installDynamicRoutes(router);
          if (router.hasRoute(PageName.DYNAMIC_ROUTE_BOOTSTRAP))
            router.removeRoute(PageName.DYNAMIC_ROUTE_BOOTSTRAP);
          await router.replace(router.currentRoute.value.fullPath);
        }
      }).catch(() => useLogin().go({ rememberReturnTo: false }));
    },
  );
};

const bindVisibilityRefresh = (): void => {
  if (visibilityBound || typeof document === "undefined") {
    return;
  }
  visibilityBound = true;
  const onVisible = (): void => {
    if (document.visibilityState !== "visible") {
      return;
    }
    const expiresAt = usePermissions().expiresAt;
    if (!expiresAt) {
      return;
    }
    const deadline = Date.parse(expiresAt);
    if (Number.isNaN(deadline) || Date.now() < deadline) {
      return;
    }
    void refreshSessionPermissions({ refreshMenusIfVersionChanged: true }).catch(() => undefined);
  };
  document.addEventListener("visibilitychange", onVisible);
  window.addEventListener("focus", onVisible);
};

const assertExpectedDomain = (data: Pick<IamBootstrap, "context">): void => {
  const expected = getAdminRuntimeConfig().login.expectedDomain ?? "TENANT";
  if (data.context.domain !== expected) {
    throw new DomainMismatchError(expected, data.context.domain);
  }
};

const applyPasswordChangeState = (data: PasswordChangeState): void => {
  assertExpectedDomain(data);
  if (!data.mustChangePassword) {
    throw new Error("改密状态已变化，请重新登录");
  }
  usePermissions().clear();
  useRouterStore().clearForPasswordChange();
  clearAdminQueryCache();
  useUserInfoStore().applyUserInfo({
    ...emptyUserInfo(),
    memberId: data.context.memberId,
    accountId: data.context.accountId,
    domain: data.context.domain,
    tenantId: data.context.tenantId ?? null,
    mustChangePwd: true,
  });
};

let passwordChangePromise: Promise<void> | undefined;
type SessionFeedbackOptions = Pick<RequestOptions, "feedback">;

export const requirePasswordChange = (options?: SessionFeedbackOptions): Promise<void> => {
  if (useUserInfoStore().getIsInitPwd) return Promise.resolve();
  if (passwordChangePromise) return passwordChangePromise;
  // 先清掉旧业务内容，状态失败时也不能继续用已缓存的菜单和权限。
  usePermissions().bumpContextEpoch();
  usePermissions().clear();
  useRouterStore().clearForPasswordChange();
  clearAdminQueryCache();
  const epoch = usePermissions().contextEpoch;
  const pending = PasswordChangeStateAPI(options)
    .then((state) => {
      if (usePermissions().contextEpoch === epoch) applyPasswordChangeState(state.data);
    })
    .finally(() => {
      if (passwordChangePromise === pending) passwordChangePromise = undefined;
    });
  passwordChangePromise = pending;
  return pending;
};

const applyBootstrap = (data: IamBootstrap): void => {
  assertExpectedDomain(data);
  useUserInfoStore().applyUserInfo(toUserInfo(data));
  const permissions = usePermissions();
  permissions.applyCapabilities({
    actionCodes: data.actionCodes,
    version: data.version,
    expiresAt: data.expiresAt,
  });
  permissions.applyContext(data);
  useRouterStore().applyRemoteMenus(mapIamMenus(data.menus));
};

export const resetSessionBootstrap = (): void => {
  bootstrapped = false;
  bootstrapPromise = undefined;
  refreshPromise = undefined;
  passwordChangePromise = undefined;
};

export const ensureSessionBootstrap = (options?: SessionFeedbackOptions): Promise<void> => {
  if (bootstrapped) {
    return Promise.resolve();
  }
  if (bootstrapPromise) {
    return bootstrapPromise;
  }
  let epoch = usePermissions().contextEpoch;
  const pending = IamBootstrapAPI(options)
    .catch(async (error: unknown) => {
      if (epoch !== usePermissions().contextEpoch) return undefined;
      if (!(error instanceof ApiError) || error.code !== StatusCode.PasswordChangeRequired)
        throw error;
      const passwordChange = requirePasswordChange(options);
      // 改密门禁自身会推进身份纪元；只接受这一门禁仍属于当前身份的结果。
      epoch = usePermissions().contextEpoch;
      await passwordChange;
      return undefined;
    })
    .then((response) => {
      if (epoch !== usePermissions().contextEpoch) return;
      if (response) applyBootstrap(response.data);
      bootstrapped = true;
      bindVisibilityRefresh();
      bindIdentityChannel();
    })
    .catch((error) => {
      if (bootstrapPromise === pending) bootstrapPromise = undefined;
      throw error;
    });
  bootstrapPromise = pending;
  return pending;
};

export const refreshSessionPermissions = (options?: {
  refreshMenusIfVersionChanged?: boolean;
}): Promise<void> => {
  if (useUserInfoStore().getIsInitPwd) return Promise.resolve();
  if (refreshPromise) {
    return refreshPromise;
  }
  const previousVersion = usePermissions().version;
  const epoch = usePermissions().contextEpoch;
  const pending = IamCapabilitiesAPI()
    .then(async (response) => {
      if (useUserInfoStore().getIsInitPwd || usePermissions().contextEpoch !== epoch) return;
      usePermissions().applyCapabilities(response.data);
      if (
        options?.refreshMenusIfVersionChanged &&
        response.data.version !== undefined &&
        response.data.version !== previousVersion
      ) {
        const bootstrap = await IamBootstrapAPI();
        if (!useUserInfoStore().getIsInitPwd && usePermissions().contextEpoch === epoch)
          applyBootstrap(bootstrap.data);
      }
    })
    .catch((error: unknown) => {
      if (usePermissions().contextEpoch === epoch) {
        usePermissions().markUnavailable();
      }
      throw error;
    })
    .finally(() => {
      if (refreshPromise === pending) refreshPromise = undefined;
    });
  refreshPromise = pending;
  return pending;
};

/** 身份重验期间暂停受保护页面；当前切换包含改密门禁，完成路由后恢复渲染。 */
export const beginIdentitySwitch = async (
  onReady?: () => Promise<void>,
  options?: SessionFeedbackOptions,
): Promise<void> => {
  const auth = useAuthStore();
  if (auth.loggingOut) return;
  auth.switchingIdentity = true;
  const transition = clearIdentityContext();
  await ensureSessionBootstrap(options);
  if (auth.loggingOut || transition !== identityTransitionVersion) return;
  await onReady?.();
  if (!auth.loggingOut && transition === identityTransitionVersion) auth.switchingIdentity = false;
};

/** 菜单写入后主动获取完整会话配置，替换已注册路由。 */
export const refreshSessionMenus = async (): Promise<void> => {
  const epoch = usePermissions().contextEpoch;
  const response = await IamBootstrapAPI();
  if (epoch === usePermissions().contextEpoch && !useUserInfoStore().getIsInitPwd)
    applyBootstrap(response.data);
};
