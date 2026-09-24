<template>
  <in-dialog v-model="visible" title="添加成员" width="840px" append-to-body>
    <div class="in-split-picker h-420px flex">
      <div
        class="w-1/2 min-w-0 flex flex-col overflow-hidden"
      >
        <div class="p-12px">
          <el-input
            v-model="keyword"
            clearable
            placeholder="请输入姓名"
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
            :disabled="!items.length"
            @change="privateToggleLoaded"
          >
            全选本页
          </el-checkbox>
        </div>
        <div class="flex-1 min-h-0 overflow-auto px-12px">
          <label
            v-for="item in items"
            :key="item.id"
            class="flex items-center gap-8px py-8px cursor-pointer"
          >
            <el-checkbox :model-value="selectedIds.has(item.id)" @change="privateToggle(item)" />
            <in-avatar :src="item.avatar" :name="item.name" :show-name="false" />
            <span class="truncate">{{ item.name }}</span>
          </label>
          <div v-if="!items.length && !loading" class="text-[var(--el-text-color-secondary)] py-16px">
            暂无成员
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
          <span>已选：{{ draft.length }} 名成员</span>
          <in-button type="primary" link @in-click="privateClear">清空</in-button>
        </div>
        <div class="flex-1 min-h-0 overflow-auto px-12px pb-12px">
          <div
            v-for="item in draft"
            :key="item.id"
            class="flex items-center gap-8px py-8px"
          >
            <in-avatar :src="item.avatar" :name="item.name" :show-name="false" />
            <span class="truncate flex-1">{{ item.name }}</span>
            <in-close-button size="sm" :label="`移除 ${item.name}`" @click="privateRemove(item.id)" />
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
import { IAM_DEFAULT_PAGE_SIZE, type IamSelectOption } from "../models/iam";

defineOptions({ name: "BizIamMemberPickerDialog" });

const props = defineProps<{
  loadMembers: (params: LoadDataParams) => Promise<Page<IamSelectOption>>;
}>();

const emits = defineEmits<{ confirm: [members: IamSelectOption[]] }>();

const visible = ref(false);
const keyword = ref("");
const items = ref<IamSelectOption[]>([]);
const draft = ref<IamSelectOption[]>([]);
const page = ref(1);
const total = ref(0);
const loading = ref(false);
const pageSize = IAM_DEFAULT_PAGE_SIZE;

const selectedIds = computed(() => new Set(draft.value.map((item) => item.id)));
const allPageSelected = computed(
  () => items.value.length > 0 && items.value.every((item) => selectedIds.value.has(item.id)),
);
const somePageSelected = computed(
  () => !allPageSelected.value && items.value.some((item) => selectedIds.value.has(item.id)),
);

const privateLoad = async (): Promise<void> => {
  if (loading.value) {
    return;
  }
  loading.value = true;
  try {
    const data = await props.loadMembers({
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
  if (selectedIds.value.has(item.id)) {
    draft.value = draft.value.filter((current) => current.id !== item.id);
    return;
  }
  draft.value = [...draft.value, item];
};

const privateToggleLoaded = (): void => {
  if (allPageSelected.value) {
    const loaded = new Set(items.value.map((item) => item.id));
    draft.value = draft.value.filter((item) => !loaded.has(item.id));
    return;
  }
  const merged = new Map(draft.value.map((item) => [item.id, item]));
  for (const item of items.value) {
    merged.set(item.id, item);
  }
  draft.value = [...merged.values()];
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
  emits("confirm", [...draft.value]);
  visible.value = false;
};

defineExpose({
  show(current: IamSelectOption[]) {
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
