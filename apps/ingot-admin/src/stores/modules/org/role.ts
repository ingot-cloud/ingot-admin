import type { SysRole, RolePageItemVO, RoleGroupItemVO, SysRoleGroup, Option } from "@/models";
import {
  RoleOptionsAPI,
  RoleListAPI,
  RoleGroupListAPI,
  CreateRoleAPI,
  UpdateRoleAPI,
  RemoveRoleAPI,
  CreateRoleGroupAPI,
  UpdateRoleGroupAPI,
  RemoveRoleGroupAPI,
  GroupSortAPI,
} from "@/api/org/role";

export const useRoleStore = defineStore("org.role", () => {
  const roleOptions = ref<Array<Option<string>>>([]);
  const needUpdate = ref(false);

  const fetchRoleOptions = () => {
    return new Promise<Array<Option<string>>>((resolve, reject) => {
      if (!needUpdate.value && roleOptions.value.length !== 0) {
        resolve(roleOptions.value);
        return;
      }

      RoleOptionsAPI()
        .then((resposne) => {
          needUpdate.value = false;
          roleOptions.value = resposne.data;
          resolve(resposne.data);
        })
        .then((e) => {
          reject(e);
        });
    });
  };

  const fetchRoleList = (condition?: SysRole) => {
    return new Promise<Array<RolePageItemVO>>((resolve, reject) => {
      RoleListAPI(condition)
        .then((response) => {
          resolve(response.data);
        })
        .catch((e) => {
          reject(e);
        });
    });
  };

  const fetchRoleGroupList = () => {
    return new Promise<Array<RoleGroupItemVO>>((resolve, reject) => {
      RoleGroupListAPI()
        .then((response) => {
          resolve(response.data);
        })
        .catch((e) => {
          reject(e);
        });
    });
  };

  const createRole = (params: SysRole) => {
    return new Promise<void>((resolve, reject) => {
      CreateRoleAPI(params)
        .then(() => {
          needUpdate.value = true;
          resolve();
        })
        .catch(() => {
          reject();
        });
    });
  };

  const updateRole = (params: SysRole) => {
    return new Promise<void>((resolve, reject) => {
      UpdateRoleAPI(params)
        .then(() => {
          needUpdate.value = true;
          resolve();
        })
        .catch(() => {
          reject();
        });
    });
  };

  const removeRole = (id: string) => {
    return new Promise<void>((resolve, reject) => {
      RemoveRoleAPI(id)
        .then(() => {
          needUpdate.value = true;
          resolve();
        })
        .catch(() => {
          reject();
        });
    });
  };

  const createRoleGroup = (params: SysRoleGroup) => {
    return new Promise<void>((resolve, reject) => {
      CreateRoleGroupAPI(params)
        .then(() => {
          resolve();
        })
        .catch(() => {
          reject();
        });
    });
  };

  const updateRoleGroup = (params: SysRoleGroup) => {
    return new Promise<void>((resolve, reject) => {
      UpdateRoleGroupAPI(params)
        .then(() => {
          resolve();
        })
        .catch(() => {
          reject();
        });
    });
  };

  const removeRoleGroup = (id: string) => {
    return new Promise<void>((resolve, reject) => {
      RemoveRoleGroupAPI(id)
        .then(() => {
          resolve();
        })
        .catch(() => {
          reject();
        });
    });
  };

  const groupSort = (ids: Array<string>) => {
    return new Promise<void>((resolve, reject) => {
      GroupSortAPI(ids)
        .then(() => {
          resolve();
        })
        .catch(() => {
          reject();
        });
    });
  };

  return {
    roleOptions,
    fetchRoleOptions,
    fetchRoleGroupList,
    fetchRoleList,
    createRole,
    updateRole,
    removeRole,
    createRoleGroup,
    updateRoleGroup,
    removeRoleGroup,
    groupSort,
  };
});
