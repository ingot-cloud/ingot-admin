import type { DeptTreeNode, DeptWithManagerDTO } from "@/models";
import { DeptTreeAPI, CreateDeptAPI, UpdateDeptAPI, RemoveDeptAPI } from "@/api/org/dept";

export const useDeptStore = defineStore("org.dept", () => {
  const expandedKeys = ref<Array<string>>([]);
  const deptTree = ref<Array<DeptTreeNode>>([]);
  const childTree = ref<Array<DeptTreeNode>>([]);

  const fetchDeptTree = () => {
    return new Promise<Array<DeptTreeNode>>((resolve, reject) => {
      DeptTreeAPI()
        .then((response) => {
          const data = response.data;
          data.forEach((root) => {
            if (root.id) {
              expandedKeys.value.push(root.id);
            }
          });

          deptTree.value = data.slice();
          childTree.value = data.length > 1 ? data.slice(1) : [];
          resolve(data);
        })
        .catch(() => {
          reject();
        });
    });
  };
  const createDept = (params: DeptWithManagerDTO) => {
    return new Promise<void>((resolve, reject) => {
      CreateDeptAPI(params)
        .then(() => {
          resolve();
        })
        .catch(() => {
          reject();
        });
    });
  };
  const updateDept = (params: DeptWithManagerDTO) => {
    return new Promise<void>((resolve, reject) => {
      UpdateDeptAPI(params)
        .then(() => {
          resolve();
        })
        .catch(() => {
          reject();
        });
    });
  };
  const removeDept = (id: string) => {
    return new Promise<void>((resolve, reject) => {
      RemoveDeptAPI(id)
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
    deptTree,
    childTree,
    fetchDeptTree,
    createDept,
    updateDept,
    removeDept,
  };
});
