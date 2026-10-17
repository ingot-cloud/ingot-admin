<template>
  <div class="dept-filter" :style="treeTone">
    <el-input v-model="searchValue" placeholder="搜索部门" :prefix-icon="Search" clearable />

    <in-loading :loading="loading" class="member-dept-tree">
      <in-tree
        ref="deptTreeRef"
        :data="data"
        :props="{ label: 'name', children: 'children' }"
        node-key="id"
        highlight-current
        :indent="DEPT_TREE_INDENT"
        :default-expanded-keys="defaultExpandedKeys"
        :filter-node-method="privateFilterNode"
        @node-click="privateOnNodeClick"
      >
        <template #default="{ node, data: item }">
          <div class="dept-item" :class="{ 'is-root': isRootDepartment(item) }">
            <in-avatar
              v-if="isRootDepartment(item)"
              :src="tenantAvatar"
              :name="departmentNameInitial(item.name)"
              :size="ROOT_DEPT_AVATAR_SIZE"
              :show-name="false"
            />
            <svg
              v-else
              class="dept-icon"
              :width="CHILD_DEPT_ICON_SIZE"
              :height="CHILD_DEPT_ICON_SIZE"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              data-icon="OrganizationOutlined"
              aria-hidden="true"
            >
              <path
                d="M6.304 16.5h11.392c.25-.15.52-.27.804-.355v-2.146a1 1 0 0 0-1-1h-11a1 1 0 0 0-1 1v2.146c.285.085.555.205.804.355ZM3.5 16.145v-2.146a3 3 0 0 1 3-3H11V8.873a4 4 0 1 1 2 0v2.126h4.5a3 3 0 0 1 3 3v2.146a3.5 3.5 0 1 1-2.804.355H6.304a3.5 3.5 0 1 1-2.804-.355ZM12 6.999a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM19.5 21a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm-15 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
                fill="currentColor"
              />
            </svg>
            <span class="text">{{ node.label }}</span>
          </div>
        </template>
      </in-tree>
    </in-loading>
  </div>
</template>

<script setup lang="ts">
import { Search } from "@element-plus/icons-vue";
import type { DepartmentTreeNode } from "@ingot/admin-common";
import {
  CHILD_DEPT_ICON_SIZE,
  DEPT_TREE_INDENT,
  DEPT_TREE_ROW_HEIGHT,
  departmentNameInitial,
  isRootDepartment,
  ROOT_DEPT_AVATAR_SIZE,
} from "../deptTree";

defineOptions({ name: "DeptTreePanel" });

const props = defineProps<{
  data: DepartmentTreeNode[];
  loading?: boolean;
  tenantAvatar?: string;
}>();

const emits = defineEmits<{
  "node-click": [value: DepartmentTreeNode];
}>();

const deptTreeRef = ref();
const searchValue = ref("");
const defaultExpandedKeys = ref<string[]>([]);
const selectedRootId = ref<string>();
const treeTone: Record<string, string> = {
  "--el-tree-node-content-height": `${DEPT_TREE_ROW_HEIGHT}px`,
  "--dept-child-icon-size": `${CHILD_DEPT_ICON_SIZE}px`,
};

watch(searchValue, (value) => {
  deptTreeRef.value?.filter(value);
});

const privateOnNodeClick = (value: DepartmentTreeNode): void => {
  emits("node-click", value);
};

const privateFilterNode = (value: string, data: { name?: string }): boolean => {
  if (!value || !data.name) {
    return true;
  }
  return data.name.includes(value);
};

watch(
  () => props.data,
  (tree) => {
    const root = tree.find((item) => isRootDepartment(item)) ?? tree[0];
    const rootId = root?.id;
    if (!root || selectedRootId.value === rootId) {
      return;
    }
    selectedRootId.value = rootId;
    nextTick(() => {
      const node = deptTreeRef.value?.getNode(root);
      node?.store.setCurrentNode(node);
      privateOnNodeClick(root);
    });
  },
  { immediate: true },
);

defineExpose({
  refreshKeys(): void {
    selectedRootId.value = undefined;
    defaultExpandedKeys.value = [];
  },
});
</script>

<style scoped lang="postcss">
.dept-filter {
  --dept-tree-current-bg: rgb(240, 244, 255);

  @apply flex flex-col min-w-0 w-full h-full min-h-0 overflow-hidden;
  background: var(--in-container-bg);

  & .member-dept-tree {
    margin-top: var(--in-space-5);
    flex: 1;
    min-height: 0;
    overflow: auto;
  }

  & :deep(.el-tree-node__content) {
    padding-right: var(--in-space-2);
    border-radius: 2px;
    box-sizing: border-box;
  }

  & :deep(.el-tree-node__expand-icon) {
    margin-left: var(--in-space-2);
  }

  & :deep(.el-tree-node.is-current > .el-tree-node__content),
  & :deep(.el-tree-node.is-current > .el-tree-node__content:hover) {
    background-color: var(--dept-tree-current-bg) !important;
    color: var(--in-color-primary);
  }

  & :deep(.el-tree-node.is-current > .el-tree-node__content .dept-icon),
  & :deep(.el-tree-node.is-current > .el-tree-node__content .text) {
    color: var(--in-color-primary);
  }

  & :deep(.el-tree-node__content:has(.dept-item.is-root) .el-tree-node__expand-icon) {
    width: 0;
    min-width: 0;
    margin-left: 0;
    overflow: hidden;
  }

  & .dept-item {
    display: flex;
    flex-direction: row;
    align-items: center;
    height: 100%;
    width: 100%;
    padding-left: var(--in-space-2);
    box-sizing: border-box;

    &.is-root {
      gap: var(--in-space-3);
    }

    &:not(.is-root) {
      gap: var(--in-space-2);
    }

    & :deep(.in-avatar-field) {
      flex-shrink: 0;
    }

    & :deep(.in-avatar) {
      border-radius: 2px;
    }

    & :deep(.in-avatar__fallback) {
      font-size: var(--in-font-size-caption);
    }

    & .dept-icon {
      flex-shrink: 0;
      width: var(--dept-child-icon-size);
      height: var(--dept-child-icon-size);
      color: var(--in-text-color);
    }

    & .text {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      color: var(--in-text-color);
      font-size: var(--in-font-size-body);
      font-weight: var(--in-font-weight-body);
      line-height: var(--in-line-height-body);
    }
  }
}
</style>
