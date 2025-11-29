import type { RoleTreeNodeVO, PermissionTreeNode } from "@/models";
import { copyParams } from "@/utils/object";
import { useRoleStore } from "@/stores/modules/org/role";

const roleStore = useRoleStore();
export const useOps = () => {
  const loading = ref(false);
  const records = ref<Array<PermissionTreeNode>>([]);
  const currentNode = reactive<RoleTreeNodeVO>({ id: "", name: "" });

  const fetchData = (): void => {
    loading.value = true;
    roleStore
      .getBindAuthorities(currentNode.id!)
      .then((data) => {
        records.value = data;
        loading.value = false;
      })
      .catch(() => {
        loading.value = false;
      });
  };

  /**
   * 处理节点点击事件
   */
  const handleTreeNodeClick = (node: RoleTreeNodeVO): void => {
    copyParams(currentNode, node);
    fetchData();
  };

  return {
    loading,
    records,
    currentNode,
    fetchData,
    handleTreeNodeClick,
  };
};
