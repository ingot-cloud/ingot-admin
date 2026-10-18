<template>
  <div
    class="dept-field relative box-border flex min-h-32px w-full cursor-pointer flex-wrap items-center gap-4px rounded-6px border border-solid border-[#d0d3d6] bg-white py-3px pl-4px pr-36px hover:border-[var(--el-color-primary)]"
    @click="privateOpen"
  >
    <span v-if="!model.length" class="px-8px text-[var(--in-text-color-placeholder)]"
      >请选择部门</span
    >
    <span
      v-for="item in model"
      :key="item.id"
      class="dept-field__tag inline-flex h-24px max-w-full items-center gap-4px rounded-2px bg-[#eff0f1] pl-8px pr-2px text-14px text-[#1f2329]"
    >
      <department-mark variant="glyph" />
      <span class="truncate">{{ item.name }}</span>
      <in-close-button size="sm" :label="`移除 ${item.name}`" @click="privateRemoveDraft(item.id)" />
    </span>
    <button
      type="button"
      class="absolute top-1/2 right-8px inline-flex -translate-y-1/2 border-0 bg-transparent p-0 text-[var(--el-text-color-secondary)] cursor-pointer"
      aria-label="请选择部门"
      @click.stop="privateOpen"
    >
      <in-icon name="ep:edit" />
    </button>
  </div>
  <in-dialog v-model="visible" title="请选择部门" width="900px" append-to-body>
    <div class="dept-picker in-split-picker h-522px flex">
      <in-loading :loading="loading" class="w-1/2! min-w-0 flex flex-col overflow-hidden">
        <div class="px-16px pt-16px pb-8px">
          <el-input v-model="keyword" clearable placeholder="请输入部门名">
            <template #prefix>
              <in-icon name="ep:search" />
            </template>
          </el-input>
        </div>
        <div class="flex-1 min-h-0 overflow-auto pl-16px pr-4px pb-12px">
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
          <div v-if="loadFailed" class="flex items-center gap-8px py-16px">
            <span class="text-[var(--el-text-color-secondary)]">加载失败</span>
            <in-button type="primary" link @in-click="privateLoad">重试</in-button>
          </div>
          <div
            v-else-if="!tree.length && !loading"
            class="text-[var(--el-text-color-secondary)] py-16px"
          >
            暂无部门
          </div>
        </div>
      </in-loading>
      <div class="w-1/2 min-w-0 flex flex-col overflow-hidden">
        <div class="flex items-center justify-between px-12px pt-16px pb-8px">
          <span class="text-14px text-[#18263c]">已选：{{ selected.length }} 个部门</span>
          <in-button type="primary" link :disabled="!selected.length" @in-click="privateClear"
            >清空</in-button
          >
        </div>
        <div class="flex-1 min-h-0 overflow-auto px-4px pb-12px">
          <div
            v-for="item in selected"
            :key="item.id"
            class="flex items-center gap-8px min-h-48px px-8px"
          >
            <department-mark />
            <span class="min-w-0 flex-1">
              <span class="block truncate text-14px leading-22px text-[#18263c]">{{
                item.name
              }}</span>
              <span v-if="item.path" class="block truncate text-12px leading-18px text-[#8f959e]">{{
                item.path
              }}</span>
            </span>
            <in-close-button :label="`移除 ${item.name}`" @click="privateRemove(item.id)" />
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <in-button @in-click="privateCancel">取消</in-button>
      <in-button type="primary" :disabled="loading" @in-click="privateConfirm">确定</in-button>
    </template>
  </in-dialog>
</template>

<script setup lang="ts">
import { InCloseButton } from "@ingot/admin-core";
import type { DepartmentTreeNode, MemberDepartmentView } from "@ingot/admin-common";
import { TenantDepartmentTreeAPI } from "@/api/iam/directory";
import { isRootDepartment, nestRootDepartmentChildren, toMemberDeptNode } from "../deptTree";
import {
  flattenDepartmentChoices,
  mergeDepartmentSelection,
  toDepartmentViews,
  withCatalogPaths,
  type DepartmentChoice,
} from "../departmentSelection";
import DepartmentMark from "./DepartmentMark.vue";

defineOptions({ name: "MemberDepartmentField" });

const model = defineModel<MemberDepartmentView[]>({ required: true });

const visible = ref(false);
const loading = ref(false);
const loadFailed = ref(false);
const keyword = ref("");
const tree = ref<DepartmentTreeNode[]>([]);
const selected = ref<DepartmentChoice[]>([]);
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

const privateFilterNode = (value: string, data: DepartmentTreeNode): boolean => {
  if (!value) {
    return true;
  }
  return data.name.toLocaleLowerCase().includes(value.toLocaleLowerCase());
};

const privateSyncChecks = async (): Promise<void> => {
  await nextTick();
  treeRef.value?.setCheckedKeys(selected.value.map((item) => item.id));
  treeRef.value?.filter(keyword.value.trim());
};

const privateLoad = (): void => {
  loading.value = true;
  loadFailed.value = false;
  TenantDepartmentTreeAPI()
    .then((response) => {
      tree.value = nestRootDepartmentChildren(response.data ?? []).map(toMemberDeptNode);
      selected.value = withCatalogPaths(selected.value, privateCatalog());
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

const privateOpen = (): void => {
  selected.value = withCatalogPaths(
    model.value.map((item) => ({ id: item.id, name: item.name, path: item.name })),
    privateCatalog(),
  );
  keyword.value = "";
  visible.value = true;
  if (!tree.value.length) {
    privateLoad();
    return;
  }
  void privateSyncChecks();
};

const privateCatalog = (): DepartmentChoice[] => flattenDepartmentChoices(tree.value);

const privateOnCheck = (): void => {
  const checked = new Set((treeRef.value?.getCheckedKeys(false) ?? []).map((id) => String(id)));
  const catalog = privateCatalog();
  selected.value = withCatalogPaths(
    mergeDepartmentSelection(selected.value, checked, catalog),
    catalog,
  );
};

const privateRemoveDraft = (id: string): void => {
  model.value = model.value.filter((item) => item.id !== id);
};

const privateRemove = (id: string): void => {
  selected.value = selected.value.filter((item) => item.id !== id);
  void privateSyncChecks();
};

const privateClear = (): void => {
  selected.value = [];
  void privateSyncChecks();
};

const privateCancel = (): void => {
  visible.value = false;
};

const privateConfirm = (): void => {
  model.value = toDepartmentViews(selected.value);
  visible.value = false;
};
</script>

<style lang="postcss" scoped>
.dept-picker {
  --el-tree-node-content-height: 48px;
  --el-checkbox-input-width: 16px;
  --el-checkbox-input-height: 16px;
  --el-checkbox-border-radius: 4px;
  --dept-caret-collapsed: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M11.22 18.46a1 1 0 0 0 1.56 0l8.305-10.334a1 1 0 0 0-.78-1.626H3.696a1 1 0 0 0-.78 1.626L11.22 18.46Z' fill='%23646a73' transform='rotate(-90 12 12)'/%3E%3C/svg%3E");
  --dept-caret-expanded: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M11.22 18.46a1 1 0 0 0 1.56 0l8.305-10.334a1 1 0 0 0-.78-1.626H3.696a1 1 0 0 0-.78 1.626L11.22 18.46Z' fill='%23646a73'/%3E%3C/svg%3E");
}

.dept-picker :deep(.el-tree) {
  color: #1f2329;
  font-family: var(--in-font-family);
  font-size: 14px;
  font-weight: 400;
  line-height: 22px;
}

.dept-picker :deep(.el-tree-node__content) {
  align-items: center;
  height: 48px;
  padding-right: 8px;
  border-radius: 4px;
  color: #1f2329;
  font-size: 14px;
  font-weight: 400;
  line-height: 22px;
}

.dept-picker :deep(.el-tree-node__expand-icon) {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  box-sizing: content-box;
  width: 12px;
  height: 18px;
  margin-right: 6px;
  padding: 0;
  color: #646a73;
  font-size: 0;
  line-height: 0;
  transform: none !important;
}

.dept-picker :deep(.el-tree-node__expand-icon .el-icon),
.dept-picker :deep(.el-tree-node__expand-icon svg) {
  display: none;
}

.dept-picker :deep(.el-tree-node__expand-icon::before) {
  content: "";
  display: block;
  width: 12px;
  height: 12px;
  background: var(--dept-caret-collapsed) center / 12px 12px no-repeat;
}

.dept-picker :deep(.el-tree-node__expand-icon.expanded::before) {
  background-image: var(--dept-caret-expanded);
}

.dept-picker :deep(.el-tree-node__expand-icon.is-leaf) {
  pointer-events: none;
}

.dept-picker :deep(.el-tree-node__expand-icon.is-leaf::before) {
  visibility: hidden;
}

.dept-picker :deep(.el-checkbox) {
  height: 16px;
  margin-right: 7px;
  margin-left: 8px;
}

.dept-picker :deep(.el-checkbox__inner) {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

.dept-pick-node {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  height: 28px;
}

.dept-pick-name {
  color: #1f2329;
  font-size: 14px;
  font-weight: 400;
  line-height: 22px;
}
</style>
