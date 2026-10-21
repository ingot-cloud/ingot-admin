<template>
  <in-dialog
    v-model="visible"
    title="变更部门"
    description="确定后，已选成员的部门将全部替换为新部门"
    width="894px"
    layout="pinned"
    append-to-body
    class="member-batch-dept"
    @closed="privateOnClosed"
  >
    <div class="dept-picker in-split-picker h-522px flex overflow-hidden">
      <in-loading :loading="loading" class="dept-picker__pane dept-picker__pane--left min-w-0 flex flex-col">
        <div class="pt-16px pl-16px pr-8px pb-8px">
          <el-input v-model="keyword" clearable placeholder="请输入部门名">
            <template #prefix>
              <in-icon name="ep:search" />
            </template>
          </el-input>
        </div>
        <div class="min-h-0 flex-1 overflow-auto pl-16px pr-4px pb-12px">
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
                <span class="truncate text-14px">{{ data.name }}</span>
              </span>
            </template>
          </el-tree>
          <div v-if="loadFailed" class="flex items-center gap-8px py-16px">
            <span class="text-[var(--in-text-color-secondary)]">加载失败</span>
            <in-button type="primary" link @in-click="privateLoad">重试</in-button>
          </div>
          <div
            v-else-if="!tree.length && !loading"
            class="py-16px text-[var(--in-text-color-secondary)]"
          >
            暂无部门
          </div>
        </div>
      </in-loading>
      <div class="dept-picker__pane dept-picker__pane--right min-w-0 flex flex-col">
        <div
          v-if="selected.length"
          class="flex items-center justify-between px-12px pt-16px pb-8px"
        >
          <span class="text-14px text-[var(--in-text-color)]">已选：{{ selected.length }} 个部门</span>
          <in-button type="primary" link @in-click="privateClear">清空</in-button>
        </div>
        <div class="min-h-0 flex-1 overflow-auto px-4px pb-12px">
          <div
            v-for="(item, index) in selected"
            :key="item.id"
            class="flex h-40px items-center gap-8px px-8px"
            :class="{ 'bg-[var(--in-bg-color-hover)]': dragOverId === item.id }"
            @dragover.prevent="privateOnDragOver(item.id, $event)"
            @drop.prevent="privateOnDrop(item.id, $event)"
            @dragleave="privateOnDragLeave(item.id)"
          >
            <department-mark />
            <span class="min-w-0 flex-1">
              <span class="flex items-center gap-4px">
                <span class="truncate text-14px text-[var(--in-text-color)]">{{ item.name }}</span>
                <span
                  v-if="index === 0"
                  class="inline-flex h-17px shrink-0 items-center rounded-4px bg-[var(--in-permission-panel-bg)] px-4px text-10px font-500 text-[var(--in-color-primary)]"
                >
                  主部门
                </span>
              </span>
              <span
                v-if="item.path"
                class="block truncate text-12px text-[var(--in-text-color-secondary)]"
                >{{ item.path }}</span
              >
            </span>
            <span
              v-if="selected.length > 1"
              class="inline-flex h-20px w-14px cursor-grab items-center justify-center text-[var(--in-text-color)]"
              draggable="true"
              role="button"
              aria-label="调整顺序"
              @click.stop
              @dragstart="privateOnDragStart(item.id, $event)"
              @dragend="privateOnDragEnd"
            >
              <in-icon name="ep:rank" />
            </span>
            <in-close-button :label="`移除 ${item.name}`" @click="privateRemove(item.id)" />
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <in-button class="member-batch-btn" @in-click="visible = false">取消</in-button>
      <in-button
        class="member-batch-btn"
        type="primary"
        :disabled="!selected.length || loading || loadFailed"
        @in-click="privateAskConfirm"
      >
        确定
      </in-button>
    </template>
  </in-dialog>

  <in-dialog
    v-model="confirming"
    title="确认变更部门？"
    description="变更后，这些成员的任职将替换为新部门"
    width="420px"
    :show-close="false"
    append-to-body
    class="member-batch-confirm"
  >
    <template #icon>
      <in-icon name="ep:warning-filled" class="text-24px text-[var(--in-color-warning)]" />
    </template>
    <div class="member-batch-confirm__box">
      <div class="mb-12px text-14px text-[var(--in-text-color-secondary)]">部门变化</div>
      <div class="flex flex-wrap items-center gap-6px">
        <span
          v-for="item in members"
          :key="item.record.id"
          class="member-batch-chip"
        >
          <in-avatar
            :src="item.record.avatar"
            :name="item.record.displayName || item.record.id"
            :size="20"
            :show-name="false"
          />
          <span class="truncate">{{ item.record.displayName || item.record.id }}</span>
        </span>
        <span class="text-14px text-[var(--in-text-color)]">的部门将变更为</span>
        <span v-for="item in selected" :key="item.id" class="member-batch-chip">
          <department-mark :size="20" />
          <span class="truncate">{{ item.name }}</span>
        </span>
      </div>
    </div>
    <template #footer>
      <in-button class="member-batch-btn" :disabled="submitting" @in-click="confirming = false">
        取消
      </in-button>
      <in-button class="member-batch-btn" type="primary" :loading="submitting" @in-click="privateSubmit">
        确定
      </in-button>
    </template>
  </in-dialog>
</template>

<script setup lang="ts">
import { InCloseButton, Message, useCapabilities } from "@ingot/admin-core";
import {
  useOrganizationMemberScopeKey,
  type DepartmentTreeNode,
} from "@ingot/admin-common";
import { TenantDepartmentTreeAPI, TenantMemberDepartmentsAPI } from "@/api/iam/directory";
import { isRootDepartment, nestRootDepartmentChildren, toMemberDeptNode } from "../deptTree";
import {
  flattenDepartmentChoices,
  mergeDepartmentSelection,
  moveDepartmentChoice,
  toDepartmentViews,
  withCatalogPaths,
  type DepartmentChoice,
} from "../departmentSelection";
import { collectActiveMembers, type Row } from "../memberTable";
import DepartmentMark from "./DepartmentMark.vue";

defineOptions({ name: "MemberBatchDepartmentDialog" });

const emits = defineEmits<{ success: [] }>();
const scopeKey = useOrganizationMemberScopeKey(useCapabilities());
let request = 0;
let pendingTree: ReturnType<typeof TenantDepartmentTreeAPI> | undefined;

const visible = ref(false);
const confirming = ref(false);
const submitting = ref(false);
const loading = ref(false);
const loadFailed = ref(false);
const keyword = ref("");
const members = ref<Row[]>([]);
const tree = ref<DepartmentTreeNode[]>([]);
const selected = ref<DepartmentChoice[]>([]);
const draggingId = ref("");
const dragOverId = ref("");
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
  return (
    typeof data.name === "string" &&
    data.name.toLocaleLowerCase().includes(value.toLocaleLowerCase())
  );
};

const privateCatalog = (): DepartmentChoice[] => flattenDepartmentChoices(tree.value);

const privateSyncChecks = async (): Promise<void> => {
  await nextTick();
  treeRef.value?.setCheckedKeys(selected.value.map((item) => item.id));
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

const privateOnCheck = (): void => {
  const checked = new Set((treeRef.value?.getCheckedKeys(false) ?? []).map((id) => String(id)));
  const catalog = privateCatalog();
  selected.value = withCatalogPaths(
    mergeDepartmentSelection(selected.value, checked, catalog),
    catalog,
  );
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

const privateAskConfirm = (): void => {
  if (!selected.value.length) {
    return;
  }
  confirming.value = true;
};

const privateSubmit = async (): Promise<void> => {
  const targets = collectActiveMembers(members.value);
  const departments = toDepartmentViews(selected.value);
  if (targets.length === 0 || departments.length === 0) {
    return;
  }
  submitting.value = true;
  let ok = 0;
  let fail = 0;
  for (const item of targets) {
    try {
      await TenantMemberDepartmentsAPI(item.record.id, {
        expectedVersion: item.version,
        departments,
      });
      ok += 1;
    } catch {
      fail += 1;
    }
  }
  submitting.value = false;
  if (fail === 0) {
    Message.success(`已更新 ${ok} 人任职`);
    confirming.value = false;
    visible.value = false;
    emits("success");
    return;
  }
  Message.warning(`成功 ${ok} 人，失败 ${fail} 人`);
  if (ok > 0) {
    emits("success");
  }
};

const privateOnClosed = (): void => {
  confirming.value = false;
  selected.value = [];
  keyword.value = "";
};

watch(scopeKey, () => {
  request += 1;
  visible.value = false;
  tree.value = [];
  pendingTree = undefined;
  selected.value = [];
  loading.value = false;
  loadFailed.value = false;
});

defineExpose({
  show(rows: Row[]) {
    members.value = collectActiveMembers(rows);
    selected.value = [];
    keyword.value = "";
    confirming.value = false;
    visible.value = true;
    if (!tree.value.length) {
      privateLoad();
      return;
    }
    void privateSyncChecks();
  },
});
</script>

<style lang="postcss">
.member-batch-dept.in-dialog {
  border-radius: 8px;
}

.member-batch-dept .el-dialog__header {
  padding: 24px 56px 24px 24px;
}

.member-batch-dept .el-dialog__body {
  padding: 0 24px;
}

.member-batch-dept .el-dialog__footer {
  padding: 0 24px 24px;
}

.member-batch-btn {
  width: 80px;
  height: 32px;
  border-radius: 6px;
}
</style>

<style lang="postcss" scoped>
.dept-picker {
  width: 846px;
  border: 1px solid var(--in-border-color);
  --el-tree-node-content-height: 40px;
}

.dept-picker__pane {
  width: 423px;
}

.dept-picker__pane--left {
  border-right: 1px solid var(--in-border-color);
  border-radius: 0;
}

.dept-picker__pane--right {
  border-radius: 0;
}

.dept-picker :deep(.el-tree-node__content) {
  height: 40px;
}

.dept-pick-node {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.member-batch-confirm__box {
  border-radius: 8px;
  background: var(--in-bg-color-page);
  padding: 16px 20px;
}

.member-batch-chip {
  display: inline-flex;
  height: 24px;
  max-width: 100%;
  align-items: center;
  gap: 4px;
  border-radius: 4px;
  background: var(--in-bg-color-hover);
  padding: 0 8px;
  font-size: 14px;
  color: var(--in-text-color);
}
</style>
