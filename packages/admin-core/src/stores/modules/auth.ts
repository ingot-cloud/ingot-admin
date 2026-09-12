import type { UserInfo, UserEffectivePermissionVO } from "@/models/security";
import { LogoutAPI } from "@/api/common/auth";
import { UserInfoAPI, UserMenuAPI, UserPermissionsAPI } from "@/api/common/user";
import { isRoleSystemAdmin } from "@/constants/role";
import { useRouterStore } from "./router";

const emptyUserInfo = (): UserInfo => ({
  user: undefined,
  roles: [],
  allows: [],
  mustChangePwd: false,
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
        resetSessionBootstrap();
        useUserInfoStore().clear();
        usePermissions().clear();
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
  const getUserInfoWhetherExist = computed(() => userInfo.user && userInfo.user.phone);
  const getIsInitPwd = computed(() => {
    return userInfo.mustChangePwd;
  });
  const getIsSystemAdmin = computed(() => {
    return userInfo.roles.some((role) => isRoleSystemAdmin(role));
  });
  const clear = () => {
    Object.assign(userInfo, emptyUserInfo());
  };

  const applyUserInfo = (data: UserInfo): void => {
    Object.assign(userInfo, data);
    permissions.updateRoles(data.roles);
  };

  const fetchUserInfo = (): Promise<UserInfo> => {
    return UserInfoAPI().then((response) => {
      applyUserInfo(response.data);
      return response.data;
    });
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
  const version = ref<number>();
  const generatedAt = ref<string>();
  const expiresAt = ref<string>();

  const updateRoles = (params: Array<string>) => {
    roles.value = params;
  };

  const applyEffectivePermissions = (data: UserEffectivePermissionVO): void => {
    permissions.value = data.permissions ?? [];
    version.value = data.version;
    generatedAt.value = data.generatedAt;
    expiresAt.value = data.expiresAt;
  };

  const clear = (): void => {
    roles.value = [];
    permissions.value = [];
    version.value = undefined;
    generatedAt.value = undefined;
    expiresAt.value = undefined;
  };

  return {
    roles,
    permissions,
    version,
    generatedAt,
    expiresAt,
    updateRoles,
    applyEffectivePermissions,
    clear,
  };
});

let bootstrapPromise: Promise<void> | undefined;
let bootstrapped = false;
let visibilityBound = false;
let refreshPromise: Promise<void> | undefined;

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
  bootstrapPromise = Promise.all([UserInfoAPI(), UserMenuAPI(), UserPermissionsAPI()])
    .then(([infoRes, menuRes, permRes]) => {
      useUserInfoStore().applyUserInfo(infoRes.data);
      usePermissions().applyEffectivePermissions(permRes.data);
      useRouterStore().applyRemoteMenus(menuRes.data ?? []);
      bootstrapped = true;
      bindVisibilityRefresh();
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
  if (refreshPromise) {
    return refreshPromise;
  }
  const previousVersion = usePermissions().version;
  refreshPromise = UserPermissionsAPI()
    .then(async (response) => {
      usePermissions().applyEffectivePermissions(response.data);
      if (
        options?.refreshMenusIfVersionChanged &&
        response.data.version !== undefined &&
        response.data.version !== previousVersion
      ) {
        await useRouterStore().fetchRoutes(true);
      }
    })
    .finally(() => {
      refreshPromise = undefined;
    });
  return refreshPromise;
};
