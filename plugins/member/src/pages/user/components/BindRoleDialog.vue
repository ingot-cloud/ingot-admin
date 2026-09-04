<template>
  <in-dialog :title="title" v-model="isShow">
    <in-filter-container :showBacktop="false">
      <div class="auth-content">
        <in-tree
          ref="treeRef"
          v-loading="loading"
          :data="data"
          show-checkbox
          :props="treeProps"
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
import { TreeKeyAndProps, type MemberRoleTreeNodeVO } from "@/models";
import { SetUserRoleAPI } from "@/api/member/user";
import { MemberRoleTreeQueryOptions } from "@/api/member/role.query";
import { useQuery } from "@tanstack/vue-query";

const emit = defineEmits(["success"]);

const treeProps = {
  ...TreeKeyAndProps.props,
  disabled: "builtIn",
};

const treeRef = ref();
const isShow = ref(false);
const btnLoading = ref(false);
const title = ref("");
const id = ref("");
const selectedIds = ref<Array<string>>([]);
const defaultSelectedIds = ref<Array<string>>([]);
const treeQuery = useQuery(() => ({
  ...MemberRoleTreeQueryOptions(() => undefined),
  enabled: isShow.value,
}));
const data = computed(() => treeQuery.data.value ?? []);
const loading = computed(() => treeQuery.isFetching.value);

const message = useMessage();

const onCheckChange = (
  node: MemberRoleTreeNodeVO,
  isChecked: boolean,
  // childChecked: boolean
) => {
  const selectId = node.id!;
  selectedIds.value = isChecked
    ? [...selectedIds.value, selectId]
    : selectedIds.value.filter((id) => id !== selectId);
};

const handleActionButton = () => {
  btnLoading.value = true;
  SetUserRoleAPI({
    id: id.value,
    setIds: selectedIds.value,
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
