import type { RoleGroupItemVO, AuthorityTreeNode } from "@/models";
import { GetBindAuthoritiesAPI } from "@/api/org/auth";
import { copyParams } from "@/utils/object";

export const useOps = () => {
  const loading = ref(false);
  const records = ref<Array<AuthorityTreeNode>>([]);
  const currentNode = reactive<RoleGroupItemVO>({ id: "", name: "" });

  const fetchData = (): void => {
    loading.value = true;
    GetBindAuthoritiesAPI(currentNode.id!)
      .then((response) => {
        records.value = response.data;
        loading.value = false;
      })
      .catch(() => {
        loading.value = false;
      });
  };

  /**
   * 处理节点点击事件
   */
  const handleTreeNodeClick = (node: RoleGroupItemVO): void => {
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
