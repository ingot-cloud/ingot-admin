import type { UserInfo } from "@/models/security";
import { LogoutAPI } from "@/api/common/auth";
import { UserInfoAPI } from "@/api/common/user";
import type { MenuTreeNode } from "@/models";

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
        useUserInfoStore().clear();
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
  const permissions = ref<Array<string>>([]);

  const updateRoles = (params: Array<string>) => {
    roles.value = params;
  };

  const updatePermissions = (menus: Array<MenuTreeNode>) => {
    const permissionsData: Array<string> = [];
    menus.forEach((item) => {
      if (item.permissionCode) {
        permissionsData.push(item.permissionCode);
      }
      if (item.children?.length) {
        extractPermissionsItem(permissionsData, item);
      }
    });

    permissions.value = permissionsData;
  };

  return {
    roles,
    permissions,
    updateRoles,
    updatePermissions,
  };
});

const extractPermissionsItem = (permissions: Array<string>, menu: MenuTreeNode) => {
  menu.children?.forEach((item) => {
    if (item.permissionCode) {
      permissions.push(item.permissionCode);
    }
    if (item.children?.length) {
      extractPermissionsItem(permissions, item);
    }
  });
};
