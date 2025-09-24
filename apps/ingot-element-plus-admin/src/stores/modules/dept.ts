import type { DeptTreeNode } from "@/models";
import { DeptOrgTreeAPI } from "@/api/basic/dept";

export const useDeptStore = defineStore("dept", () => {
  const expandedKeys = ref<Array<string>>([]);
  const deptTree = ref<Array<DeptTreeNode>>([]);

  const fetchOrgDeptTree = (orgId: string) => {
    return new Promise<Array<DeptTreeNode>>((resolve, reject) => {
      DeptOrgTreeAPI(orgId)
        .then((response) => {
          const data = response.data;
          data.forEach((root) => {
            if (root.id) {
              expandedKeys.value.push(root.id);
            }
          });

          deptTree.value = data.slice();
          resolve(data);
        })
        .catch(() => {
          reject();
        });
    });
  };

  return {
    expandedKeys,
    deptTree,
    fetchOrgDeptTree,
  };
});
