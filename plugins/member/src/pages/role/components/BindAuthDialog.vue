<template>
  <in-dialog :title="title" v-model="isShow">
    <in-filter-container :showBacktop="false">
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
    </in-filter-container>
    <template #footer>
      <in-button @click="isShow = false"> 取消 </in-button>
      <in-button type="primary" :loading="btnLoading" @click="handleActionButton"> 确定 </in-button>
    </template>
  </in-dialog>
</template>
<script lang="ts" setup>
import { TreeKeyAndProps, type MemberPermissionTreeNodeVO } from "@/models";
import { BindAuthorityAPI } from "@/api/member/role";
import { MemberPermissionTreeQueryOptions } from "@/api/member/permission.query";
import { useQuery } from "@tanstack/vue-query";

const emit = defineEmits(["success"]);

const treeRef = ref();
const isShow = ref(false);
const btnLoading = ref(false);
const title = ref("");
const id = ref("");
const selectedIds = ref<Array<string>>([]);
const defaultSelectedIds = ref<Array<string>>([]);
const treeQuery = useQuery(() => ({
  ...MemberPermissionTreeQueryOptions(() => undefined),
  enabled: isShow.value,
}));
const data = computed(() => treeQuery.data.value ?? []);
const loading = computed(() => treeQuery.isFetching.value);

const message = useMessage();

const onCheckChange = (
  node: MemberPermissionTreeNodeVO,
  isChecked: boolean,
): void => {
  const selectId = node.id!;
  selectedIds.value = isChecked
    ? [...selectedIds.value, selectId]
    : selectedIds.value.filter((item) => item !== selectId);
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
      emit("success");
    })
    .catch(() => {
      btnLoading.value = false;
    });
};

defineExpose({
  show(idIn: string, titleIn: string, selectedIdsIn: Array<string>) {
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
