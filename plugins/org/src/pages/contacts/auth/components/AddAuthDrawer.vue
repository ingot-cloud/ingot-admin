<template>
  <in-drawer :title="title" v-model="isShow" :loading="loading" padding="0" size="30%">
    <in-split-layout :showBacktop="false">
      <div class="auth-content">
        <in-tree
          ref="treeRef"
          v-loading="loading"
          :data="data"
          show-checkbox
          :props="TreeKeyAndProps.props"
          :node-key="TreeKeyAndProps.nodeKey"
          :default-expanded-keys="defaultSelectedIds"
          :default-checked-keys="defaultSelectedIds"
          @check-change="onCheckChange"
        />
      </div>
    </in-split-layout>
    <template #footer>
      <in-button @click="isShow = false"> 取消 </in-button>
      <in-button type="primary" :loading="btnLoading" @click="handleActionButton"> 确定 </in-button>
    </template>
  </in-drawer>
</template>
<script lang="ts" setup>
import { TreeKeyAndProps, type PermissionTreeNode } from "@/models";
import { BindAuthorityAPI } from "@/api/org/role";
import { OrgAuthTreeQueryOptions } from "@/api/org/auth.query";
import { orgRoleQueryKeys } from "@/api/org/role.query";
import { useQuery, useQueryClient } from "@tanstack/vue-query";

interface DataItem extends PermissionTreeNode {
  disabled?: boolean;
}

const queryClient = useQueryClient();
const emit = defineEmits(["success"]);

const treeRef = ref();
const isShow = ref(false);
const btnLoading = ref(false);
const title = ref("");
const id = ref("");
const selectedIds = ref<Array<string>>([]);
const defaultSelectedIds = ref<Array<string>>([]);
const readonlySelectedIds = ref<Array<string>>([]);
const treeQuery = useQuery(() => ({
  ...OrgAuthTreeQueryOptions(),
  enabled: isShow.value,
}));

const message = useMessage();

const markDisabled = (nodes: Array<DataItem>, readonlyIds: Array<string>): Array<DataItem> => {
  return nodes.map((item) => ({
    ...item,
    disabled: readonlyIds.includes(item.id!),
    children: item.children
      ? markDisabled(item.children as Array<DataItem>, readonlyIds)
      : item.children,
  }));
};

const data = computed(() => markDisabled(treeQuery.data.value ?? [], readonlySelectedIds.value));
const loading = computed(() => treeQuery.isFetching.value);

const onCheckChange = (
  node: DataItem,
  isChecked: boolean,
  // childChecked: boolean
) => {
  if (node.disabled) {
    return;
  }
  const selectId = node.id!;
  selectedIds.value = isChecked
    ? [...selectedIds.value, selectId]
    : selectedIds.value.filter((id) => id !== selectId);
};

const handleActionButton = () => {
  const checkedNodes = treeRef.value.getCheckedNodes();
  const realSelectIds = checkedNodes.map((node: any) => node.id);

  // 如果当前选中的节点父节点也选中，那么不需要绑定当前节点
  const bindIds = checkedNodes
    .filter((node: any) => {
      return !realSelectIds.some((id: any) => id === node.pid);
    })
    .map((node: any) => {
      return node.id;
    });
  // 过滤权限，如果父节点是选中状态，那么不需要绑定当前节点，并且孙子节点等都不需要
  btnLoading.value = true;
  BindAuthorityAPI({
    id: id.value,
    setIds: bindIds,
  })
    .then(() => {
      message.success("操作成功");
      btnLoading.value = false;
      isShow.value = false;
      void queryClient.invalidateQueries({ queryKey: orgRoleQueryKeys.permissions(id.value) });
      emit("success");
    })
    .catch(() => {
      btnLoading.value = false;
    });
};

defineExpose({
  show(
    idIn: string,
    titleIn: string,
    selectedIdsIn: Array<string>,
    readonlySelectedIdsIn: Array<string>,
  ) {
    readonlySelectedIds.value = readonlySelectedIdsIn;
    id.value = idIn;
    isShow.value = true;
    title.value = titleIn;
    selectedIds.value = selectedIdsIn;
    defaultSelectedIds.value = selectedIdsIn;
  },
});
</script>
<style lang="postcss" scoped>
.auth-content {
  --el-fill-color-blank: rgba(23, 26, 29, 0.03);
  @apply max-h-50vh overflow-y-auto;
  background-color: rgba(23, 26, 29, 0.03);
  border-radius: 12px;
}
</style>
