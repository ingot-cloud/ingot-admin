import type { PermissionTreeNode, MetaPermission, PermissionFilterDTO } from "@/models";
import {
  GetAuthorityTreeAPI,
  CreateAuthorityAPI,
  UpdateAuthorityAPI,
  RemoveAuthorityAPI,
} from "@/api/basic/authority";

export const useAuthorityStore = defineStore("authority", () => {
  const expandedKeys = ref<Array<string>>([]);
  const authorityTree = ref<Array<PermissionTreeNode>>([]);

  const fetchAuthorityTree = (filter?: PermissionFilterDTO) => {
    return new Promise<Array<PermissionTreeNode>>((resolve, reject) => {
      GetAuthorityTreeAPI(filter)
        .then((response) => {
          const data = response.data;
          data.forEach((item) => {
            if (item.id) {
              expandedKeys.value.push(item.id);
            }
          });

          authorityTree.value = data.slice();
          resolve(data);
        })
        .catch(() => {
          reject();
        });
    });
  };
  const createAuthority = (params: MetaPermission) => {
    return new Promise<void>((resolve, reject) => {
      CreateAuthorityAPI(params)
        .then(() => {
          resolve();
        })
        .catch(() => {
          reject();
        });
    });
  };
  const updateAuthority = (params: MetaPermission) => {
    return new Promise<void>((resolve, reject) => {
      UpdateAuthorityAPI(params)
        .then(() => {
          resolve();
        })
        .catch(() => {
          reject();
        });
    });
  };
  const removeAuthority = (id: string) => {
    return new Promise<void>((resolve, reject) => {
      RemoveAuthorityAPI(id)
        .then(() => {
          resolve();
        })
        .catch(() => {
          reject();
        });
    });
  };

  return {
    expandedKeys,
    authorityTree,
    fetchAuthorityTree,
    createAuthority,
    updateAuthority,
    removeAuthority,
  };
});
