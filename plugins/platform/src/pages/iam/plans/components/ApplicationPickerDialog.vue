<template>
  <in-dialog v-model="visible" title="选择应用" width="920px" layout="pinned" append-to-body>
    <div class="in-split-picker h-420px flex">
      <div
        class="w-1/2 min-w-0 flex flex-col overflow-hidden"
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
        <div class="flex-1 min-h-0 overflow-auto px-12px">
          <label
            v-for="item in items"
            :key="item.id"
            class="flex items-center gap-8px py-8px cursor-pointer min-w-0"
          >
            <el-checkbox :model-value="isChecked(item.id)" @change="privateToggle(item)" />
            <span class="truncate">{{ item.name }}</span>
            <span class="ml-auto text-12px text-[var(--el-text-color-secondary)] truncate">
              {{ item.code }}
            </span>
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
        class="w-1/2 min-w-0 flex flex-col overflow-hidden"
      >
        <div class="flex items-center justify-between px-12px py-12px">
          <span>已选：{{ draft.length }} 个应用</span>
          <in-button type="primary" link @in-click="privateClear">清空</in-button>
        </div>
        <div class="flex-1 min-h-0 overflow-auto px-12px pb-12px">
          <div v-if="!draft.length" class="text-12px text-[var(--el-text-color-secondary)]">尚未选择应用</div>
          <div v-for="item in draft" :key="item.id" class="w-full flex items-center gap-8px py-8px min-w-0">
            <span class="truncate">{{ item.name }}</span>
            <span class="text-12px text-[var(--el-text-color-secondary)] truncate">{{ item.code }}</span>
            <span class="ml-auto shrink-0">
              <in-close-button size="sm" :label="`移除 ${item.name}`" @click="privateRemove(item.id)" />
            </span>
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
import { InCloseButton, type Page } from "@ingot/admin-core";
import { IAM_DEFAULT_PAGE_SIZE } from "@ingot/admin-common";
import type { PlanAppOption } from "../wizard";

defineOptions({ name: "PlanApplicationPickerDialog" });

const props = defineProps<{
  loadApplications: (params: { current?: number; size?: number; query?: string }) => Promise<Page<PlanAppOption>>;
}>();

const emits = defineEmits<{ confirm: [applications: PlanAppOption[]] }>();

const visible = ref(false);
const keyword = ref("");
const items = ref<PlanAppOption[]>([]);
const draft = ref<PlanAppOption[]>([]);
const page = ref(1);
const total = ref(0);
const loading = ref(false);
const pageSize = IAM_DEFAULT_PAGE_SIZE;

const selectedIds = computed(() => new Set(draft.value.map((item) => item.id)));
const isChecked = (id: string): boolean => selectedIds.value.has(id);

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

const privateToggle = (item: PlanAppOption): void => {
  if (selectedIds.value.has(item.id)) {
    draft.value = draft.value.filter((current) => current.id !== item.id);
    return;
  }
  draft.value = [...draft.value, item];
};

const privateRemove = (id: string): void => {
  draft.value = draft.value.filter((item) => item.id !== id);
};

const privateClear = (): void => {
  draft.value = [];
};

const privateCancel = (): void => {
  visible.value = false;
};

const privateConfirm = (): void => {
  emits(
    "confirm",
    draft.value.map((item) => ({ ...item })),
  );
  visible.value = false;
};

defineExpose({
  show(current: PlanAppOption[]) {
    draft.value = current.map((item) => ({ ...item }));
    keyword.value = "";
    page.value = 1;
    total.value = 0;
    items.value = [];
    visible.value = true;
    void privateLoad();
  },
});
</script>
