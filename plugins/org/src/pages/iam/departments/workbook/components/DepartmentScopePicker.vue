<template>
  <div class="dept-scope-picker">
    <div class="dept-scope-picker__search">
      <el-input v-model="keyword" clearable placeholder="请输入部门名">
        <template #prefix>
          <in-icon name="ep:search" />
        </template>
      </el-input>
    </div>
    <in-loading :loading="loading" class="dept-scope-picker__tree">
      <el-tree
        v-if="tree.length"
        ref="treeRef"
        :data="tree"
        node-key="id"
        show-checkbox
        check-strictly
        check-on-click-node
        :expand-on-click-node="false"
        :indent="26"
        :default-expanded-keys="expandedKeys"
        :props="treeProps"
        :filter-node-method="privateFilterNode"
        @check="privateOnCheck"
      >
        <template #default="{ data }">
          <span class="dept-pick-node">
            <department-mark />
            <span class="dept-pick-name truncate">{{ data.name }}</span>
          </span>
        </template>
      </el-tree>
      <div v-else-if="loadFailed" class="flex items-center gap-8px py-16px">
        <span class="text-[var(--in-text-color-secondary)]">加载失败</span>
        <in-button type="primary" link @in-click="privateLoad">重试</in-button>
      </div>
      <div v-else-if="!loading" class="py-16px text-[var(--in-text-color-secondary)]">暂无部门</div>
    </in-loading>
  </div>
</template>

<script setup lang="ts">
import type { DepartmentTreeNode } from "@ingot/admin-common";
import { TenantDepartmentTreeAPI } from "@/api/iam/directory";
import DepartmentMark from "../../../members/components/DepartmentMark.vue";
import { isRootDepartment, nestRootDepartmentChildren, toMemberDeptNode } from "../../../members/deptTree";

defineOptions({ name: "DepartmentScopePicker" });

const selectedIds = defineModel<string[]>({ default: () => [] });
const keyword = ref("");
const loading = ref(false);
const loadFailed = ref(false);
const tree = ref<DepartmentTreeNode[]>([]);
const treeProps = { label: "name", children: "children" };
const treeRef = ref<{
  filter: (value: string) => void;
  getCheckedKeys: (leafOnly?: boolean) => Array<string | number>;
  setCheckedKeys: (keys: string[]) => void;
}>();
const expandedKeys = computed(() =>
  tree.value.filter((node) => isRootDepartment(node)).map((node) => node.id),
);

watch(keyword, (value) => {
  treeRef.value?.filter(value.trim());
});

const privateFilterNode = (value: string, data: { name?: unknown }): boolean => {
  if (!value) {
    return true;
  }
  return typeof data.name === "string" && data.name.toLocaleLowerCase().includes(value.toLocaleLowerCase());
};

const privateSyncChecks = async (): Promise<void> => {
  await nextTick();
  treeRef.value?.setCheckedKeys(selectedIds.value);
  treeRef.value?.filter(keyword.value.trim());
};

const privateLoad = (): void => {
  loading.value = true;
  loadFailed.value = false;
  TenantDepartmentTreeAPI()
    .then((response) => {
      tree.value = nestRootDepartmentChildren((response.data ?? []).map(toMemberDeptNode));
      return privateSyncChecks();
    })
    .catch(() => {
      loadFailed.value = true;
      tree.value = [];
    })
    .finally(() => {
      loading.value = false;
    });
};

const privateOnCheck = (): void => {
  selectedIds.value = (treeRef.value?.getCheckedKeys(false) ?? []).map((id) => String(id));
};

onMounted(() => {
  privateLoad();
});
</script>

<style lang="postcss" scoped>
.dept-scope-picker {
  margin-top: 8px;
  --el-tree-node-content-height: 48px;
}

.dept-scope-picker__search {
  padding: 8px 0;
}

.dept-scope-picker__tree {
  max-height: 360px;
  overflow: auto;
  padding-bottom: 4px;
}

.dept-scope-picker :deep(.el-tree) {
  color: var(--in-text-color);
  font-family: var(--in-font-family);
  font-size: 14px;
  font-weight: 400;
  line-height: 22px;
}

.dept-scope-picker :deep(.el-tree-node__content) {
  align-items: center;
  height: 48px;
  padding-right: 8px;
  border-radius: 4px;
  color: var(--in-text-color);
  font-size: 14px;
  font-weight: 400;
  line-height: 22px;
}

.dept-scope-picker :deep(.el-checkbox) {
  margin-right: 7px;
  margin-left: 8px;
}

.dept-pick-node {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  height: 28px;
}

.dept-pick-name {
  color: var(--in-text-color);
  font-size: 14px;
  font-weight: 400;
  line-height: 22px;
}
</style>
