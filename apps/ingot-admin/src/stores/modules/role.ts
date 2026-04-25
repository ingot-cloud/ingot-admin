import type { RoleTreeNodeVO, Option } from "@/models";
import { RoleTreeAPI } from "@/api/platform/admin/role";

export const useRoleStore = defineStore("role", () => {
  const roleOrgTree = ref<Array<RoleTreeNodeVO>>([]);
  const fetchRoleOrgTree = (orgId: string) => {
    return new Promise<Array<RoleTreeNodeVO>>((resolve, reject) => {
      RoleTreeAPI(orgId)
        .then((response) => {
          roleOrgTree.value = response.data;
          resolve(response.data);
        })
        .catch(() => {
          reject();
        });
    });
  };

  return {
    roleOrgTree,
    fetchRoleOrgTree,
  };
});
