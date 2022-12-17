import { ref, computed } from "vue";
import { defineStore } from "pinia";
import type { DeptTreeNode, SysDept } from "@/models";
import {
  DeptTreeAPI,
  CreateDeptAPI,
  UpdateDeptAPI,
  RemoveDeptAPI,
} from "@/api/basic/dept";

export const useDeptStore = defineStore("dept", () => {
  const expandedKeys = ref<Array<string>>([]);
  const deptTree = ref<Array<DeptTreeNode>>([]);
  const needUpdate = ref(false);

  const getDeptTreeListData = computed(() => {
    return {
      props: {
        children: "children",
        hasChildren: "hasChildren",
      },
      key: "id",
      data: deptTree.value,
    };
  });

  const fetchDeptTree = () => {
    return new Promise<Array<DeptTreeNode>>((resolve, reject) => {
      if (!needUpdate.value && deptTree.value.length !== 0) {
        resolve(deptTree.value);
        return;
      }
      DeptTreeAPI()
        .then((response) => {
          const data = response.data;
          const expandedKeys: Array<string> = [];
          data.forEach((root) => {
            if (root.id) {
              expandedKeys.push(root.id);
            }
          });

          needUpdate.value = false;
          deptTree.value = data;
          resolve(data);
        })
        .catch(() => {
          reject();
        });
    });
  };
  const createDept = (params: SysDept) => {
    return new Promise<void>((resolve, reject) => {
      CreateDeptAPI(params)
        .then(() => {
          needUpdate.value = true;
          resolve();
        })
        .catch(() => {
          reject();
        });
    });
  };
  const updateDept = (params: SysDept) => {
    return new Promise<void>((resolve, reject) => {
      UpdateDeptAPI(params)
        .then(() => {
          needUpdate.value = true;
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
          needUpdate.value = true;
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
    getDeptTreeListData,
    fetchDeptTree,
    createDept,
    updateDept,
    removeDept,
  };
});
