import type {
  RoleTreeNodeVO,
  TenantRolePrivate,
  Option,
  SetDTO,
  BizPermissionTreeNodeVO,
} from "@/models";
import {
  RoleOptionsAPI,
  RoleTreeAPI,
  CreateRoleAPI,
  UpdateRoleAPI,
  RemoveRoleAPI,
  RoleSortAPI,
  BindAuthorityAPI,
  GetBindAuthoritiesAPI,
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

  const fetchRoleTree = (condition?: TenantRolePrivate) => {
    return new Promise<Array<RoleTreeNodeVO>>((resolve, reject) => {
      RoleTreeAPI(condition)
        .then((response) => {
          resolve(response.data);
        })
        .catch((e) => {
          reject(e);
        });
    });
  };

  const createRole = (params: TenantRolePrivate) => {
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

  const updateRole = (params: TenantRolePrivate) => {
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

  const sortRole = (ids: Array<string>) => {
    return new Promise<void>((resolve, reject) => {
      RoleSortAPI(ids)
        .then(() => {
          resolve();
        })
        .catch(() => {
          reject();
        });
    });
  };

  const bindAuthority = (params: SetDTO) => {
    return new Promise<void>((resolve, reject) => {
      BindAuthorityAPI(params)
        .then(() => {
          resolve();
        })
        .catch(() => {
          reject();
        });
    });
  };

  const getBindAuthorities = (id: string) => {
    return new Promise<Array<BizPermissionTreeNodeVO>>((resolve, reject) => {
      GetBindAuthoritiesAPI(id)
        .then((response) => {
          resolve(response.data);
        })
        .catch(() => {
          reject();
        });
    });
  };

  return {
    roleOptions,
    fetchRoleOptions,
    fetchRoleTree,
    createRole,
    updateRole,
    removeRole,
    sortRole,
    bindAuthority,
    getBindAuthorities,
  };
});
