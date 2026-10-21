<template>
  <in-selection-field
    class="dept-field"
    :items="model"
    :disabled="disabled"
    :placeholder="placeholder"
    closable
    @click="privateOpen"
    @remove="privateRemoveDraft($event.id)"
  >
    <template #tag-avatar>
      <department-mark :size="20" />
    </template>
    <template v-if="$slots['tag-suffix']" #tag-suffix="{ item }">
      <slot name="tag-suffix" :item="item" />
    </template>
  </in-selection-field>
  <in-dialog
    v-model="visible"
    :title="placeholder"
    :width="multiple ? '900px' : '600px'"
    layout="pinned"
    append-to-body
  >
    <div class="dept-picker in-split-picker h-522px flex">
      <in-loading
        :loading="loading"
        class="min-w-0 flex flex-col overflow-hidden"
        :class="multiple ? 'w-1/2!' : 'w-full!'"
      >
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
            :show-checkbox="multiple"
            check-strictly
            :check-on-click-node="multiple"
            :highlight-current="!multiple"
            :expand-on-click-node="false"
            :indent="26"
            :default-expanded-keys="expandedKeys"
            :props="treeProps"
            :filter-node-method="privateFilterNode"
            @check="privateOnCheck"
            @node-click="privateChooseSingle"
          >
            <template #default="{ data }">
              <span class="dept-pick-node" :class="{ 'is-disabled': privateDisabled(data) }">
                <el-radio
                  v-if="!multiple"
                  :model-value="selected[0]?.id"
                  :value="data.id"
                  :disabled="privateDisabled(data)"
                  :aria-label="data.name"
                  @change="privateChooseSingle(data)"
                  @click.stop
                />
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
      <div v-if="multiple" class="w-1/2 min-w-0 flex flex-col overflow-hidden">
        <div class="flex items-center justify-between px-12px pt-16px pb-8px">
          <span class="text-14px text-[var(--in-text-color)]">拖曳部门可调整优先级</span>
          <in-button type="primary" link :disabled="!selected.length" @in-click="privateClear"
            >清空</in-button
          >
        </div>
        <div class="flex-1 min-h-0 overflow-auto px-4px pb-12px">
          <div
            v-for="(item, index) in selected"
            :key="item.id"
            class="flex items-center gap-8px min-h-48px px-8px"
            :class="{ 'bg-[var(--in-bg-color-hover)]': dragOverId === item.id }"
            @dragover.prevent="privateOnDragOver(item.id, $event)"
            @drop.prevent="privateOnDrop(item.id, $event)"
            @dragleave="privateOnDragLeave(item.id)"
          >
            <department-mark />
            <span class="min-w-0 flex-1">
              <span class="flex items-center gap-4px">
                <span class="truncate text-14px leading-22px text-[var(--in-text-color)]">{{
                  item.name
                }}</span>
                <span
                  v-if="index === 0"
                  class="shrink-0 inline-flex h-17px items-center rounded-4px bg-[var(--in-permission-panel-bg)] px-4px text-10px font-500 leading-17px text-[var(--in-color-primary)]"
                >
                  主部门
                </span>
              </span>
              <span
                v-if="item.path"
                class="block truncate text-12px leading-18px text-[var(--in-text-color-secondary)]"
                >{{ item.path }}</span
              >
            </span>
            <span
              class="inline-flex h-20px w-14px cursor-grab items-center justify-center text-[var(--in-text-color)]"
              draggable="true"
              role="button"
              aria-label="调整顺序"
              @click.stop
              @dragstart="privateOnDragStart(item.id, $event)"
              @dragend="privateOnDragEnd"
            >
              <svg
                width="1em"
                height="1em"
                viewBox="0 0 16 16"
                fill="currentColor"
                aria-hidden="true"
              >
                <circle cx="5" cy="3" r="1.15" />
                <circle cx="11" cy="3" r="1.15" />
                <circle cx="5" cy="8" r="1.15" />
                <circle cx="11" cy="8" r="1.15" />
                <circle cx="5" cy="13" r="1.15" />
                <circle cx="11" cy="13" r="1.15" />
              </svg>
            </span>
            <in-close-button :label="`移除 ${item.name}`" @click="privateRemove(item.id)" />
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <in-button @in-click="privateCancel">取消</in-button>
      <in-button v-if="!multiple && selected.length" @in-click="privateClear">清除选择</in-button>
      <in-button type="primary" :disabled="loading || loadFailed" @in-click="privateConfirm"
        >确定</in-button
      >
    </template>
  </in-dialog>
</template>

<script setup lang="ts">
import { InCloseButton, InSelectionField, useCapabilities } from "@ingot/admin-core";
import {
  useOrganizationMemberScopeKey,
  type DepartmentTreeNode,
  type MemberDepartmentView,
} from "@ingot/admin-common";
import { TenantDepartmentTreeAPI } from "@/api/iam/directory";
import { isRootDepartment, nestRootDepartmentChildren, toMemberDeptNode } from "../deptTree";
import {
  flattenDepartmentChoices,
  mergeDepartmentSelection,
  moveDepartmentChoice,
  toDepartmentViews,
  withCatalogPaths,
  departmentSubtreeIds,
  type DepartmentChoice,
} from "../departmentSelection";
import DepartmentMark from "./DepartmentMark.vue";

defineOptions({ name: "MemberDepartmentField" });

const props = withDefaults(
  defineProps<{
    multiple?: boolean;
    disabled?: boolean;
    placeholder?: string;
    excludeDepartmentId?: string;
  }>(),
  { multiple: true, placeholder: "请选择部门" },
);
const scopeKey = useOrganizationMemberScopeKey(useCapabilities());
let request = 0;
let pendingTree: ReturnType<typeof TenantDepartmentTreeAPI> | undefined;

const model = defineModel<MemberDepartmentView[]>({ required: true });

const visible = ref(false);
const loading = ref(false);
const loadFailed = ref(false);
const keyword = ref("");
const tree = ref<DepartmentTreeNode[]>([]);
const selected = ref<DepartmentChoice[]>([]);
const draggingId = ref("");
const dragOverId = ref("");
const excluded = computed(() => departmentSubtreeIds(tree.value, props.excludeDepartmentId));
const privateDisabled = (node: { navigationOnly?: unknown; id?: unknown }): boolean =>
  node.navigationOnly === true || (typeof node.id === "string" && excluded.value.has(node.id));
const treeProps = { label: "name", children: "children", disabled: privateDisabled };
const treeRef = ref<{
  filter: (value: string) => void;
  getCheckedKeys: (leafOnly?: boolean) => Array<string | number>;
  setCheckedKeys: (keys: string[]) => void;
  setCurrentKey: (key?: string) => void;
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
  return (
    typeof data.name === "string" &&
    data.name.toLocaleLowerCase().includes(value.toLocaleLowerCase())
  );
};

const privateSyncChecks = async (): Promise<void> => {
  await nextTick();
  if (props.multiple) treeRef.value?.setCheckedKeys(selected.value.map((item) => item.id));
  else treeRef.value?.setCurrentKey(selected.value[0]?.id);
  treeRef.value?.filter(keyword.value.trim());
};

const privateLoad = (): void => {
  const current = ++request;
  loading.value = true;
  loadFailed.value = false;
  const pending: ReturnType<typeof TenantDepartmentTreeAPI> =
    pendingTree ||
    TenantDepartmentTreeAPI().finally(() => {
      if (pendingTree === pending) pendingTree = undefined;
    });
  pendingTree = pending;
  pending
    .then((response) => {
      if (current !== request) return;
      tree.value = nestRootDepartmentChildren((response.data ?? []).map(toMemberDeptNode));
      selected.value = withCatalogPaths(selected.value, privateCatalog());
      return privateSyncChecks();
    })
    .catch(() => {
      if (current !== request) return;
      loadFailed.value = true;
      tree.value = [];
    })
    .finally(() => {
      if (current === request) loading.value = false;
    });
};

const privateOpen = (): void => {
  if (props.disabled || visible.value) return;
  selected.value = withCatalogPaths(
    model.value.map((item) => ({ id: item.id, name: item.name, path: "" })),
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
  if (!props.multiple) return;
  const checked = new Set((treeRef.value?.getCheckedKeys(false) ?? []).map((id) => String(id)));
  const catalog = privateCatalog();
  selected.value = withCatalogPaths(
    mergeDepartmentSelection(selected.value, checked, catalog),
    catalog,
  );
};

const privateChooseSingle = (node: DepartmentTreeNode): void => {
  if (props.multiple) return;
  if (privateDisabled(node)) {
    void privateSyncChecks();
    return;
  }
  const choice = privateCatalog().find((item) => item.id === node.id);
  if (choice) selected.value = [choice];
  void privateSyncChecks();
};

const privateRemoveDraft = (id: string): void => {
  if (props.disabled) return;
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

const privateOnDragStart = (id: string, event: DragEvent): void => {
  draggingId.value = id;
  event.dataTransfer?.setData("text/plain", id);
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
  }
};

const privateOnDragOver = (id: string, event: DragEvent): void => {
  if (!draggingId.value) {
    return;
  }
  event.preventDefault();
  dragOverId.value = id;
};

const privateOnDragLeave = (id: string): void => {
  if (dragOverId.value === id) {
    dragOverId.value = "";
  }
};

const privateOnDrop = (id: string, event: DragEvent): void => {
  event.preventDefault();
  const fromId = draggingId.value;
  draggingId.value = "";
  dragOverId.value = "";
  if (!fromId) {
    return;
  }
  selected.value = moveDepartmentChoice(selected.value, fromId, id);
};

const privateOnDragEnd = (): void => {
  draggingId.value = "";
  dragOverId.value = "";
};

const privateCancel = (): void => {
  visible.value = false;
};

const privateConfirm = (): void => {
  if (props.disabled || loading.value || loadFailed.value) return;
  model.value = toDepartmentViews(selected.value);
  visible.value = false;
};
watch([scopeKey, () => props.excludeDepartmentId], () => {
  request++;
  visible.value = false;
  tree.value = [];
  pendingTree = undefined;
  selected.value = [];
  loading.value = false;
  loadFailed.value = false;
});
watch(visible, (value) => {
  if (!value && loading.value) {
    request++;
    loading.value = false;
  }
});
onBeforeUnmount(() => {
  request++;
});
</script>

<style lang="postcss" scoped>
.dept-picker {
  border-color: var(--in-border-color);
  --el-tree-node-content-height: 48px;
}

.dept-picker > * + * {
  border-color: var(--in-border-color);
}

.dept-picker :deep(.el-tree) {
  color: var(--in-text-color);
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
  color: var(--in-text-color);
  font-size: 14px;
  font-weight: 400;
  line-height: 22px;
}

.dept-picker :deep(.el-checkbox) {
  margin-right: 7px;
  margin-left: 8px;
}

.dept-picker :deep(.el-radio) {
  margin: 0;
}
.dept-picker :deep(.el-radio__label) {
  display: none;
}
.dept-pick-node.is-disabled {
  opacity: 0.5;
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
