<template>
  <in-dialog v-model="visible" title="选择操作" width="920px" layout="pinned" append-to-body>
    <div class="h-420px flex gap-12px">
      <div
        class="w-1/2 min-w-0 flex flex-col border border-[var(--in-border-color)] rounded-4px overflow-hidden"
      >
        <div class="p-12px">
          <el-input
            v-model="keyword"
            clearable
            placeholder="搜索操作或资源"
            @input="privateOnFilter"
          >
            <template #prefix>
              <in-icon name="ep:search" />
            </template>
          </el-input>
        </div>
        <div class="flex-1 min-h-0 overflow-auto px-8px">
          <in-tree
            v-if="treeData.length"
            ref="treeRef"
            :data="treeData"
            node-key="id"
            show-checkbox
            check-strictly
            default-expand-all
            :props="treeProps"
            :default-checked-keys="checkedKeys"
            @check-change="privateOnCheckChange"
          >
            <template #default="{ data }">
              <span class="flex items-center gap-8px min-w-0 w-full pr-8px">
                <span class="truncate">{{ data.name }}</span>
                <span
                  v-if="data.kind === 'action' && data.code"
                  class="ml-auto text-12px text-[var(--el-text-color-secondary)] truncate"
                >
                  {{ data.code }}
                </span>
              </span>
            </template>
          </in-tree>
          <div v-else-if="!loading" class="text-[var(--el-text-color-secondary)] px-12px py-16px">
            暂无操作
          </div>
        </div>
      </div>
      <div
        class="w-1/2 min-w-0 flex flex-col border border-[var(--in-border-color)] rounded-4px overflow-hidden"
      >
        <div class="flex items-center justify-between px-12px py-12px">
          <span>已选：{{ draft.length }} 个操作</span>
          <in-button type="primary" link @in-click="privateClear">清空</in-button>
        </div>
        <div class="flex-1 min-h-0 overflow-auto px-12px pb-12px">
          <action-hierarchy
            :actions="draft"
            empty-text="尚未选择操作"
            :copyable="false"
            removable
            :framed="false"
            @remove="privateRemove"
          />
        </div>
      </div>
    </div>
    <template #footer>
      <in-button @in-click="privateCancel">取消</in-button>
      <in-button type="primary" @in-click="privateConfirm">确定</in-button>
    </template>
  </in-dialog>
</template>

<script setup lang="ts">
import {
  filterActionCatalog,
  type ActionCatalog,
  type MenuActionOption,
} from "../menuActions";
import ActionHierarchy from "./ActionHierarchy.vue";

defineOptions({ name: "ActionPickerDialog" });

interface ActionTreeNode {
  id: string;
  name: string;
  kind: "application" | "resource" | "action";
  code?: string;
  resourceId?: string;
  action?: MenuActionOption;
  disabled?: boolean;
  children?: ActionTreeNode[];
}

interface TreeExpose {
  setCheckedKeys: (keys: string[]) => void;
}

const props = defineProps<{
  resolveCatalog: () => Promise<ActionCatalog>;
}>();

const emits = defineEmits<{ confirm: [actions: MenuActionOption[]] }>();

const treeProps = { label: "name", children: "children", disabled: "disabled" };
const visible = ref(false);
const loading = ref(false);
const keyword = ref("");
const catalog = ref<ActionCatalog>();
const draft = ref<MenuActionOption[]>([]);
const treeRef = ref<TreeExpose>();
const applyingChecks = ref(false);

const visibleCatalog = computed(() =>
  catalog.value ? filterActionCatalog(catalog.value, keyword.value) : undefined,
);

const actionById = computed(() => {
  const map = new Map<string, MenuActionOption>();
  for (const resource of catalog.value?.resources ?? []) {
    for (const action of resource.actions) {
      map.set(action.id, action);
    }
  }
  return map;
});

const actionsOfResource = (resourceId: string): MenuActionOption[] =>
  catalog.value?.resources.find((item) => item.id === resourceId)?.actions ?? [];

const treeData = computed<ActionTreeNode[]>(() => {
  const current = visibleCatalog.value;
  if (!current) {
    return [];
  }
  return [
    {
      id: `app:${current.applicationId}`,
      name: current.applicationName,
      kind: "application",
      disabled: true,
      children: current.resources.map((resource) => ({
        id: `r:${resource.id}`,
        name: resource.name,
        kind: "resource",
        resourceId: resource.id,
        children: resource.actions.map((action) => ({
          id: `a:${action.id}`,
          name: action.name,
          kind: "action",
          code: action.code,
          resourceId: resource.id,
          action,
        })),
      })),
    },
  ];
});

const selectedIds = computed(() => new Set(draft.value.map((item) => item.id)));

const checkedKeys = computed(() => {
  const keys = draft.value.map((item) => `a:${item.id}`);
  for (const resource of visibleCatalog.value?.resources ?? []) {
    if (resource.actions.length && resource.actions.every((item) => selectedIds.value.has(item.id))) {
      keys.push(`r:${resource.id}`);
    }
  }
  return keys;
});

const applyTreeChecks = (): void => {
  applyingChecks.value = true;
  treeRef.value?.setCheckedKeys(checkedKeys.value);
  nextTick(() => {
    applyingChecks.value = false;
  });
};

const privateOnFilter = (): void => {
  nextTick(applyTreeChecks);
};

const privateOnCheckChange = (data: ActionTreeNode, checked: boolean): void => {
  if (applyingChecks.value || data.kind === "application") {
    return;
  }
  if (data.kind === "action" && data.action) {
    if (checked) {
      if (!selectedIds.value.has(data.action.id)) {
        draft.value = [...draft.value, data.action];
      }
    } else {
      draft.value = draft.value.filter((item) => item.id !== data.action?.id);
    }
    nextTick(applyTreeChecks);
    return;
  }
  if (data.kind === "resource" && data.resourceId) {
    const resourceActions = actionsOfResource(data.resourceId);
    if (checked) {
      const merged = new Map(draft.value.map((item) => [item.id, item]));
      for (const action of resourceActions) {
        merged.set(action.id, action);
      }
      draft.value = [...merged.values()];
    } else {
      const remove = new Set(resourceActions.map((item) => item.id));
      draft.value = draft.value.filter((item) => !remove.has(item.id));
    }
    nextTick(applyTreeChecks);
  }
};

const privateRemove = (id: string): void => {
  draft.value = draft.value.filter((item) => item.id !== id);
  nextTick(applyTreeChecks);
};

const privateClear = (): void => {
  draft.value = [];
  nextTick(applyTreeChecks);
};

const privateCancel = (): void => {
  visible.value = false;
};

const privateConfirm = (): void => {
  emits(
    "confirm",
    draft.value.map((item) => actionById.value.get(item.id) ?? item),
  );
  visible.value = false;
};

defineExpose({
  show(current: MenuActionOption[]) {
    draft.value = current.map((item) => ({ ...item }));
    keyword.value = "";
    catalog.value = undefined;
    visible.value = true;
    loading.value = true;
    props
      .resolveCatalog()
      .then((data) => {
        catalog.value = data;
        nextTick(applyTreeChecks);
      })
      .finally(() => {
        loading.value = false;
      });
  },
});
</script>
