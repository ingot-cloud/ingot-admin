import type { UserInfo, UserEffectivePermissionVO } from "@/models/security";
import type { IamBootstrap, CurrentCapabilities, AuthorizationDomain, IamApplicationSummary, PasswordChangeState } from "@/models/iam";
import { PasswordChangeStateAPI } from "@/api/common/password";
import { StatusCode } from "@/net/status-code";
import { ApiError } from "@ingot/http-client";
import { LogoutAPI } from "@/api/common/auth";
import { IamBootstrapAPI, IamCapabilitiesAPI } from "@/api/common/iam";
import { mapIamMenus } from "@/router/helper/iamMenus";
import { clearAdminQueryCache } from "@/query/client";
import { getAdminRuntimeConfig } from "@/runtime";
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
    /**
     * 退出登录
     */
    const logout = async (ignoreRevokeAPI?: boolean): Promise<void> => {
      return Promise.race([
        new Promise((resolve) => {
          LogoutAPI().then(resolve).catch(resolve);
        }),
        new Promise<number>((resolve) => {
          setTimeout(
            () => {
              resolve(1);
            },
            ignoreRevokeAPI ? 0 : 1500,
          );
        }),
      ]).then(() => {
        usePermissions().bumpContextEpoch();
        resetSessionBootstrap();
        useUserInfoStore().clear();
        usePermissions().clear();
        clearAdminQueryCache();
        publishIdentityInvalidated();
      });
    };

    return {
      logout,
    };
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

export const publishIdentityInvalidated = (): void => {
  if (typeof BroadcastChannel === "undefined") {
    return;
  }
  const channel = new BroadcastChannel(IDENTITY_CHANNEL_NAME);
  channel.postMessage({ type: "invalidated" });
  channel.close();
};

const bindIdentityChannel = (): void => {
  if (identityChannelBound || typeof BroadcastChannel === "undefined") {
    return;
  }
  identityChannelBound = true;
  const channel = new BroadcastChannel(IDENTITY_CHANNEL_NAME);
  channel.addEventListener("message", () => {
    void beginIdentitySwitch().catch(() => {
      window.location.assign("/auth/start");
    });
  });
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
    void refreshSessionPermissions({ refreshMenusIfVersionChanged: true });
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

export const requirePasswordChange = (): Promise<void> => {
  if (useUserInfoStore().getIsInitPwd) return Promise.resolve();
  if (passwordChangePromise) return passwordChangePromise;
  // 先清掉旧业务内容，状态失败时也不能继续用已缓存的菜单和权限。
  usePermissions().bumpContextEpoch();
  usePermissions().clear();
  useRouterStore().clearForPasswordChange();
  clearAdminQueryCache();
  const epoch = usePermissions().contextEpoch;
  passwordChangePromise = PasswordChangeStateAPI().then((state) => {
    if (usePermissions().contextEpoch === epoch) applyPasswordChangeState(state.data);
  }).finally(() => { passwordChangePromise = undefined; });
  return passwordChangePromise;
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
};

export const ensureSessionBootstrap = (): Promise<void> => {
  if (bootstrapped) {
    return Promise.resolve();
  }
  if (bootstrapPromise) {
    return bootstrapPromise;
  }
  bootstrapPromise = IamBootstrapAPI()
    .catch(async (error: unknown) => {
      if (!(error instanceof ApiError) || error.code !== StatusCode.PasswordChangeRequired) throw error;
      await requirePasswordChange();
      return undefined;
    })
    .then((response) => {
      if (response) applyBootstrap(response.data);
      bootstrapped = true;
      bindVisibilityRefresh();
      bindIdentityChannel();
    })
    .catch((error) => {
      bootstrapPromise = undefined;
      throw error;
    });
  return bootstrapPromise;
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
  refreshPromise = IamCapabilitiesAPI()
    .then(async (response) => {
      if (useUserInfoStore().getIsInitPwd || usePermissions().contextEpoch !== epoch) return;
      usePermissions().applyCapabilities(response.data);
      if (
        options?.refreshMenusIfVersionChanged &&
        response.data.version !== undefined &&
        response.data.version !== previousVersion
      ) {
        const bootstrap = await IamBootstrapAPI();
        if (!useUserInfoStore().getIsInitPwd && usePermissions().contextEpoch === epoch) applyBootstrap(bootstrap.data);
      }
    })
    .finally(() => {
      refreshPromise = undefined;
    });
  return refreshPromise;
};

export const beginIdentitySwitch = async (): Promise<void> => {
  usePermissions().bumpContextEpoch();
  resetSessionBootstrap();
  useUserInfoStore().clear();
  usePermissions().clear();
  clearAdminQueryCache();
  await ensureSessionBootstrap();
};
