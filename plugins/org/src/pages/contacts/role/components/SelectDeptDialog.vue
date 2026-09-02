<template>
  <in-dialog :title="title" v-model="visible" width="400" class="dept-filter">
    <in-tree
      v-loading="loading"
      ref="deptTreeRef"
      class="dept-tree"
      :data="deptTree"
      :props="TreeKeyAndProps.props"
      :node-key="TreeKeyAndProps.nodeKey"
      :default-expanded-keys="defaultExpandedKeys"
      @node-click="privateOnNodeClick"
    >
      <template #default="{ node, data }">
        <div class="dept-item">
          <img :src="'/favicon.ico'" class="logo" v-if="data.mainFlag" />
          <span class="text">{{ node.label }}</span>
        </div>
      </template>
    </in-tree>
  </in-dialog>
</template>
<script setup lang="ts">
import { TreeKeyAndProps, type DeptTreeNode } from "@/models";
import { useOrgDeptStore } from "@/stores/modules/dept";

const loading = ref(false);
const title = ref("选择部门");
const visible = ref(false);
const deptTree = ref<Array<DeptTreeNode>>([]);
const defaultExpandedKeys = ref<Array<string>>([]);
const deptStore = useOrgDeptStore();

const emits = defineEmits(["onNodeClick"]);
const privateOnNodeClick = (value: DeptTreeNode) => {
  if (value.mainFlag) {
    return;
  }
  emits("onNodeClick", value);
  visible.value = false;
};

defineExpose({
  show: () => {
    visible.value = true;
    deptStore
      .fetchDeptSimpleTree()
      .then((data) => {
        loading.value = false;
        deptTree.value = data;
        defaultExpandedKeys.value = [data[0].id!];
      })
      .catch(() => {
        loading.value = false;
      });
  },
});
</script>
<style scoped lang="postcss">
.dept-filter {
  @apply flex flex-col;

  & .dept-tree {
    @apply m-t-[var(--in-common-margin)];
  }

  & .dept-item {
    @apply flex flex-row items-center gap-2;

    height: 100%;
    width: 100%;

    & .logo {
      height: 30px;
      width: 30px;
    }

    & .text {
      flex: 1;
      max-width: 160px;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      font-size: 14px;
    }
  }
}
</style>
