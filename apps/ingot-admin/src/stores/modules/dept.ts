import type { DeptTreeNodeWithManagerVO } from "@/models";
import { DeptTreeAPI } from "@/api/platform/system/dept";

export const useDeptStore = defineStore("dept", () => {
  const expandedKeys = ref<Array<string>>([]);
  const deptTree = ref<Array<DeptTreeNodeWithManagerVO>>([]);

  const fetchOrgDeptTree = (orgId: string) => {
    return new Promise<Array<DeptTreeNodeWithManagerVO>>((resolve, reject) => {
      DeptTreeAPI(orgId)
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
