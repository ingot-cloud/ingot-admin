import type { UserToken, UserInfo } from "@/models/security";
import { RefreshTokenAPI, RevokeTokenAPI, AuthorizeCodeTokenAPI } from "@/api/common/auth";
import { UserInfoAPI } from "@/api/common/user";
import type { MenuTreeNode } from "@/models";
/**
 * 授权信息
 */
export const useAuthStore = defineStore(
  "security",
  () => {
    const token = reactive<UserToken>({});

    const getAccessToken = computed(() => {
      if (token.accessToken && token.tokenType) {
        return `${token.tokenType} ${token.accessToken}`;
      }
      return "";
    });

    const getRefreshToken = computed(() => {
      return token.refreshToken || "";
    });

    const getOrg = computed(() => {
      return token.org || "";
    });

    // 更新 token
    const updateToken = (value: UserToken) => {
      Object.assign(token, value);
    };

    /**
     * 授权码登录
     * @param code 授权码
     * @returns
     */
    const codeLogin = (code: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        AuthorizeCodeTokenAPI(code)
          .then((response) => {
            updateToken(response.data);
            resolve();
          })
          .catch((err) => {
            reject(err);
          });
      });
    };

    /**
     * 刷新token
     */
    const refreshToken = (): Promise<UserToken> => {
      return new Promise((resolve, reject) => {
        RefreshTokenAPI(getRefreshToken.value)
          .then((response) => {
            updateToken(response.data);
            resolve(response.data);
          })
          .catch((err) => {
            reject(err);
          });
      });
    };

    /**
     * 退出登录
     */
    const logout = (ignoreRevokeAPI?: boolean): Promise<void> => {
      return Promise.race([
        new Promise((resolve) => {
          RevokeTokenAPI(getAccessToken.value).then(resolve).catch(resolve);
        }),
        new Promise<any>((resolve) => {
          // 不忽略revokeAPI最多等待退出接口1500ms
          setTimeout(
            () => {
              resolve(1);
            },
            ignoreRevokeAPI ? 0 : 1500,
          );
        }),
      ]).then(() => {
        updateToken({
          accessToken: undefined,
          tokenType: undefined,
          refreshToken: undefined,
          expiresIn: undefined,
          scope: undefined,
        });
        useUserInfoStore().clear();
      });
    };

    return {
      token,
      getAccessToken,
      getRefreshToken,
      getOrg,
      updateToken,
      codeLogin,
      refreshToken,
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

  const defaultUser = {
    user: undefined,
    roles: [],
    allows: [],
  };
  const userInfo = reactive<UserInfo>(defaultUser);

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
    return userInfo.user && userInfo.user.initPwd;
  });

  const clear = () => {
    Object.assign(userInfo, { user: undefined, roles: [] });
  };

  const fetchUserInfo = (): Promise<UserInfo> => {
    return new Promise((resolve, reject) => {
      UserInfoAPI()
        .then((response) => {
          Object.assign(userInfo, response.data);
          permissions.updateRoles(response.data.roles);
          resolve(response.data);
        })
        .catch((e) => {
          reject(e);
        });
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
    clear,
    fetchUserInfo,
  };
});

export const usePermissions = defineStore("security.permissions", () => {
  const roles = ref<Array<string>>([]);
  const authorities = ref<Array<string>>([]);

  const updateRoles = (params: Array<string>) => {
    roles.value = params;
  };

  const updateAuthorities = (menus: Array<MenuTreeNode>) => {
    const permissions: Array<string> = [];
    menus.forEach((item) => {
      if (item.authorityCode) {
        permissions.push(item.authorityCode);
      }
      if (item.children?.length) {
        extractPermissionsItem(permissions, item);
      }
    });

    authorities.value = permissions;
  };

  return {
    roles,
    authorities,
    updateRoles,
    updateAuthorities,
  };
});

const extractPermissionsItem = (permissions: Array<string>, menu: MenuTreeNode) => {
  menu.children?.forEach((item) => {
    if (item.authorityCode) {
      permissions.push(item.authorityCode);
    }
    if (item.children?.length) {
      extractPermissionsItem(permissions, item);
    }
  });
};
