<template>
  <in-dialog v-model="visible" title="选择应用" width="840px" layout="pinned" append-to-body>
    <div class="h-420px flex gap-12px">
      <div
        class="w-1/2 min-w-0 flex flex-col border border-[var(--in-border-color)] rounded-4px overflow-hidden"
      >
        <div class="p-12px">
          <el-input
            v-model="keyword"
            clearable
            placeholder="搜索应用名"
            @keyup.enter="privateSearch"
            @clear="privateSearch"
          >
            <template #prefix>
              <in-icon name="ep:search" />
            </template>
          </el-input>
        </div>
        <div class="px-12px pb-8px">
          <el-checkbox
            :model-value="allPageSelected"
            :indeterminate="somePageSelected"
            :disabled="!unlockedPageItems.length"
            @change="privateToggleLoaded"
          >
            全选本页
          </el-checkbox>
        </div>
        <div class="flex-1 min-h-0 overflow-auto px-12px">
          <label
            v-for="item in items"
            :key="item.id"
            class="flex items-center gap-8px py-8px"
            :class="isLocked(item.id) ? 'cursor-not-allowed' : 'cursor-pointer'"
          >
            <el-checkbox
              :model-value="isChecked(item.id)"
              :disabled="isLocked(item.id)"
              @change="privateToggle(item)"
            />
            <span class="truncate">{{ item.name }}</span>
          </label>
          <div v-if="!items.length && !loading" class="text-[var(--el-text-color-secondary)] py-16px">
            暂无应用
          </div>
        </div>
        <el-pagination
          v-if="total > pageSize"
          class="shrink-0 justify-end px-12px py-8px"
          :current-page="page"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          small
          @current-change="privateOnPageChange"
        />
      </div>
      <div
        class="w-1/2 min-w-0 flex flex-col border border-[var(--in-border-color)] rounded-4px overflow-hidden"
      >
        <div class="flex items-center justify-between px-12px py-12px">
          <span>已选：{{ draft.length }} 个应用</span>
          <in-button type="primary" link @in-click="privateClear">清空</in-button>
        </div>
        <div class="flex-1 min-h-0 overflow-auto px-12px pb-12px">
          <div v-for="item in draft" :key="item.id" class="flex items-center gap-8px py-8px">
            <span class="truncate flex-1">{{ item.name }}</span>
            <in-close-button
              v-if="!isLocked(item.id)"
              size="sm"
              :label="`移除 ${item.name}`"
              @click="privateRemove(item.id)"
            />
          </div>
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
import { InCloseButton, type LoadDataParams, type Page } from "@ingot/admin-core";
import { IAM_DEFAULT_PAGE_SIZE, type IamSelectOption } from "@ingot/admin-common";

defineOptions({ name: "ApplicationPickerDialog" });

const props = withDefaults(
  defineProps<{
    loadApplications: (params: LoadDataParams) => Promise<Page<IamSelectOption>>;
    lockedIds?: Set<string>;
  }>(),
  {
    lockedIds: () => new Set<string>(),
  },
);

const emits = defineEmits<{ confirm: [applications: IamSelectOption[]] }>();

const visible = ref(false);
const keyword = ref("");
const items = ref<IamSelectOption[]>([]);
const draft = ref<IamSelectOption[]>([]);
const page = ref(1);
const total = ref(0);
const loading = ref(false);
const pageSize = IAM_DEFAULT_PAGE_SIZE;

const isLocked = (id: string): boolean => props.lockedIds.has(id);
const isChecked = (id: string): boolean => isLocked(id) || draft.value.some((item) => item.id === id);

const unlockedPageItems = computed(() => items.value.filter((item) => !isLocked(item.id)));
const selectedIds = computed(() => new Set(draft.value.map((item) => item.id)));
const allPageSelected = computed(
  () =>
    unlockedPageItems.value.length > 0 &&
    unlockedPageItems.value.every((item) => selectedIds.value.has(item.id)),
);
const somePageSelected = computed(
  () => !allPageSelected.value && unlockedPageItems.value.some((item) => selectedIds.value.has(item.id)),
);

const privateLoad = async (): Promise<void> => {
  if (loading.value) {
    return;
  }
  loading.value = true;
  try {
    const data = await props.loadApplications({
      current: page.value,
      size: pageSize,
      query: keyword.value.trim() || undefined,
    });
    items.value = data.records ?? [];
    total.value = data.total ?? 0;
  } finally {
    loading.value = false;
  }
};

const privateSearch = (): void => {
  page.value = 1;
  void privateLoad();
};

const privateOnPageChange = (current: number): void => {
  page.value = current;
  void privateLoad();
};

const privateToggle = (item: IamSelectOption): void => {
  if (isLocked(item.id)) {
    return;
  }
  if (selectedIds.value.has(item.id)) {
    draft.value = draft.value.filter((current) => current.id !== item.id);
    return;
  }
  draft.value = [...draft.value, item];
};

const privateToggleLoaded = (): void => {
  if (allPageSelected.value) {
    const loaded = new Set(unlockedPageItems.value.map((item) => item.id));
    draft.value = draft.value.filter((item) => !loaded.has(item.id));
    return;
  }
  const merged = new Map(draft.value.map((item) => [item.id, item]));
  for (const item of unlockedPageItems.value) {
    merged.set(item.id, item);
  }
  draft.value = [...merged.values()];
};

const privateRemove = (id: string): void => {
  if (isLocked(id)) {
    return;
  }
  draft.value = draft.value.filter((item) => item.id !== id);
};

const privateClear = (): void => {
  draft.value = draft.value.filter((item) => isLocked(item.id));
};

const privateCancel = (): void => {
  visible.value = false;
};

const privateConfirm = (): void => {
  emits(
    "confirm",
    draft.value.filter((item) => !isLocked(item.id)),
  );
  visible.value = false;
};

defineExpose({
  show(current: IamSelectOption[]) {
    draft.value = current.filter((item) => !isLocked(item.id)).map((item) => ({ ...item }));
    keyword.value = "";
    page.value = 1;
    total.value = 0;
    items.value = [];
    visible.value = true;
    void privateLoad();
  },
});
</script>
