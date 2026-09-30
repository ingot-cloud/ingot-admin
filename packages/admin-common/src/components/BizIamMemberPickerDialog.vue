<template>
  <in-dialog v-model="visible" :title="title" width="840px" append-to-body>
    <div class="in-split-picker h-420px flex">
      <div v-loading="loading" class="w-1/2 min-w-0 flex flex-col overflow-hidden">
        <div class="p-12px">
          <el-input
            v-model="keyword"
            clearable
            :placeholder="searchPlaceholder"
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
            :disabled="loading || !items.length"
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
            <in-avatar v-if="showAvatar" :src="item.avatar" :name="item.name" :show-name="false" />
            <span class="truncate">{{ item.name }}</span>
          </label>
          <div v-if="loadFailed" class="flex items-center gap-8px py-16px">
            <span class="text-[var(--el-text-color-secondary)]">加载失败</span>
            <in-button type="primary" link @in-click="privateLoad">重试</in-button>
          </div>
          <div
            v-else-if="!items.length && !loading"
            class="text-[var(--el-text-color-secondary)] py-16px"
          >
            {{ emptyText }}
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
      <div class="w-1/2 min-w-0 flex flex-col overflow-hidden">
        <div class="flex items-center justify-between px-12px py-12px">
          <span>已选：{{ selectedCount }} {{ selectedUnit }}</span>
          <in-button type="primary" link @in-click="privateClear">清空</in-button>
        </div>
        <div class="flex-1 min-h-0 overflow-auto px-12px pb-12px">
          <div v-for="item in rightItems" :key="item.id" class="flex items-center gap-8px py-8px">
            <in-avatar v-if="showAvatar" :src="item.avatar" :name="item.name" :show-name="false" />
            <span class="truncate flex-1">{{ item.name }}</span>
            <in-close-button
              size="sm"
              :label="`移除 ${item.name}`"
              @click="privateRemove(item.id)"
            />
          </div>
          <div v-if="boundLoading" class="text-[var(--el-text-color-secondary)] py-8px">加载中</div>
          <in-button
            v-if="boundLoadFailed"
            class="w-full"
            @in-click="privateLoadBound(!boundItems.length)"
          >
            加载失败，重试
          </in-button>
          <in-button v-if="canLoadMoreBound" class="w-full" @in-click="privateLoadMoreBound">
            加载更多
          </in-button>
        </div>
      </div>
    </div>
    <template #footer>
      <in-button @in-click="privateCancel">取消</in-button>
      <in-button type="primary" :disabled="loading || boundLoading" @in-click="privateConfirm"
        >确定</in-button
      >
    </template>
  </in-dialog>
</template>

<script setup lang="ts">
import { InCloseButton, type LoadDataParams, type Page } from "@ingot/admin-core";
import { IAM_DEFAULT_PAGE_SIZE, type IamSelectOption } from "../models/iam";

defineOptions({ name: "BizIamMemberPickerDialog" });

export type MemberPickerShowInput = IamSelectOption[] | { boundIds: string[] };

const props = withDefaults(
  defineProps<{
    loadMembers: (params: LoadDataParams) => Promise<Page<IamSelectOption>>;
    loadBound?: (params: LoadDataParams) => Promise<Page<IamSelectOption>>;
    title?: string;
    searchPlaceholder?: string;
    emptyText?: string;
    selectedUnit?: string;
    showAvatar?: boolean;
  }>(),
  {
    title: "添加成员",
    searchPlaceholder: "请输入姓名",
    emptyText: "暂无成员",
    selectedUnit: "名成员",
    showAvatar: true,
  },
);

const emits = defineEmits<{
  confirm: [members: IamSelectOption[]];
  closed: [];
  "load-error": [error: unknown];
}>();

const visible = ref(false);
const keyword = ref("");
const items = ref<IamSelectOption[]>([]);
const draft = ref<IamSelectOption[]>([]);
const added = ref<IamSelectOption[]>([]);
const boundItems = ref<IamSelectOption[]>([]);
const boundIdSet = ref<Set<string>>(new Set());
const removedIds = ref<Set<string>>(new Set());
const boundMode = ref(false);
const page = ref(1);
const boundPage = ref(1);
const total = ref(0);
const boundTotal = ref(0);
const loading = ref(false);
const boundLoading = ref(false);
const loadFailed = ref(false);
const boundLoadFailed = ref(false);
const pageSize = IAM_DEFAULT_PAGE_SIZE;
let epoch = 0;
let request = 0;
const pending = new Map<string, Promise<Page<IamSelectOption>>>();
const completed = new Map<string, Page<IamSelectOption>>();

const selectedIds = computed(() => {
  if (!boundMode.value) {
    return new Set(draft.value.map((item) => item.id));
  }
  const ids = new Set(boundIdSet.value);
  for (const id of removedIds.value) {
    ids.delete(id);
  }
  for (const item of added.value) {
    ids.add(item.id);
  }
  return ids;
});
const selectedCount = computed(() => selectedIds.value.size);
const rightItems = computed(() => {
  if (!boundMode.value) {
    return draft.value;
  }
  const addedIds = new Set(added.value.map((item) => item.id));
  const boundShown = boundItems.value.filter(
    (item) => !removedIds.value.has(item.id) && !addedIds.has(item.id),
  );
  return [...added.value, ...boundShown];
});
const allPageSelected = computed(
  () => items.value.length > 0 && items.value.every((item) => selectedIds.value.has(item.id)),
);
const somePageSelected = computed(
  () => !allPageSelected.value && items.value.some((item) => selectedIds.value.has(item.id)),
);
const canLoadMoreBound = computed(
  () =>
    boundMode.value &&
    !boundLoading.value &&
    !boundLoadFailed.value &&
    boundItems.value.length < boundTotal.value,
);

const isBoundInput = (value: MemberPickerShowInput): value is { boundIds: string[] } =>
  !Array.isArray(value);

const privateLoad = async (): Promise<void> => {
  const id = ++request;
  const currentEpoch = epoch;
  const params = { current: page.value, size: pageSize, query: keyword.value.trim() || undefined };
  const key = JSON.stringify(params);
  loading.value = true;
  loadFailed.value = false;
  try {
    let promise = pending.get(key);
    if (!promise) {
      const cached = completed.get(key);
      const created: Promise<Page<IamSelectOption>> = (
        cached ? Promise.resolve(cached) : Promise.resolve().then(() => props.loadMembers(params))
      )
        .then((data) => {
          if (epoch === currentEpoch) completed.set(key, data);
          return data;
        })
        .finally(() => {
          if (pending.get(key) === created) pending.delete(key);
        });
      promise = created;
      pending.set(key, promise);
    }
    const data = await promise;
    if (epoch !== currentEpoch || id !== request) return;
    items.value = data.records ?? [];
    total.value = data.total ?? 0;
  } catch (error) {
    if (epoch === currentEpoch && id === request) {
      items.value = [];
      total.value = 0;
      loadFailed.value = true;
      emits("load-error", error);
    }
  } finally {
    if (epoch === currentEpoch && id === request) loading.value = false;
  }
};

const privateLoadBound = async (reset: boolean): Promise<void> => {
  if (!props.loadBound || boundLoading.value) {
    return;
  }
  boundLoading.value = true;
  boundLoadFailed.value = false;
  const currentEpoch = epoch;
  try {
    const nextPage = reset ? 1 : boundPage.value + 1;
    const data = await props.loadBound({
      current: nextPage,
      size: pageSize,
    });
    const records = data.records ?? [];
    if (epoch !== currentEpoch) return;
    boundPage.value = nextPage;
    boundTotal.value = data.total ?? 0;
    if (reset) {
      boundItems.value = records;
      return;
    }
    const seen = new Set(boundItems.value.map((item) => item.id));
    boundItems.value = [...boundItems.value, ...records.filter((item) => !seen.has(item.id))];
  } catch (error) {
    if (epoch === currentEpoch) {
      boundLoadFailed.value = true;
      emits("load-error", error);
    }
  } finally {
    if (epoch === currentEpoch) boundLoading.value = false;
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

const privateSelect = (item: IamSelectOption): void => {
  if (!boundMode.value) {
    draft.value = [...draft.value, item];
    return;
  }
  if (removedIds.value.has(item.id)) {
    const next = new Set(removedIds.value);
    next.delete(item.id);
    removedIds.value = next;
  }
  if (!boundIdSet.value.has(item.id) && !added.value.some((current) => current.id === item.id)) {
    added.value = [...added.value, item];
  }
};

const privateDeselect = (id: string): void => {
  if (!boundMode.value) {
    draft.value = draft.value.filter((current) => current.id !== id);
    return;
  }
  added.value = added.value.filter((current) => current.id !== id);
  if (boundIdSet.value.has(id) && !removedIds.value.has(id)) {
    const next = new Set(removedIds.value);
    next.add(id);
    removedIds.value = next;
  }
};

const privateToggle = (item: IamSelectOption): void => {
  if (selectedIds.value.has(item.id)) {
    privateDeselect(item.id);
    return;
  }
  privateSelect(item);
};

const privateToggleLoaded = (): void => {
  if (allPageSelected.value) {
    for (const item of items.value) {
      privateDeselect(item.id);
    }
    return;
  }
  for (const item of items.value) {
    if (!selectedIds.value.has(item.id)) {
      privateSelect(item);
    }
  }
};

const privateRemove = (id: string): void => {
  privateDeselect(id);
};

const privateClear = (): void => {
  if (!boundMode.value) {
    draft.value = [];
    return;
  }
  added.value = [];
  removedIds.value = new Set(boundIdSet.value);
};

const privateLoadMoreBound = (): void => {
  void privateLoadBound(false);
};

const privateCancel = (): void => {
  visible.value = false;
};

const privateConfirm = (): void => {
  if (!boundMode.value) {
    emits("confirm", [...draft.value]);
    visible.value = false;
    return;
  }
  const named = new Map<string, IamSelectOption>();
  for (const item of [...boundItems.value, ...added.value]) {
    named.set(item.id, item);
  }
  const nextIds = [...boundIdSet.value].filter((id) => !removedIds.value.has(id));
  for (const item of added.value) {
    if (!nextIds.includes(item.id)) {
      nextIds.push(item.id);
    }
  }
  emits(
    "confirm",
    nextIds.map((id) => named.get(id) ?? { id, name: id }),
  );
  visible.value = false;
};

defineExpose({
  show(current: MemberPickerShowInput = []) {
    epoch += 1;
    request += 1;
    pending.clear();
    completed.clear();
    loading.value = false;
    boundLoading.value = false;
    loadFailed.value = false;
    boundLoadFailed.value = false;
    keyword.value = "";
    page.value = 1;
    total.value = 0;
    items.value = [];
    draft.value = [];
    added.value = [];
    boundItems.value = [];
    boundPage.value = 1;
    boundTotal.value = 0;
    removedIds.value = new Set();
    visible.value = true;
    if (isBoundInput(current) && props.loadBound) {
      boundMode.value = true;
      boundIdSet.value = new Set(current.boundIds);
      void privateLoad();
      void privateLoadBound(true);
      return;
    }
    boundMode.value = false;
    boundIdSet.value = new Set();
    draft.value = Array.isArray(current) ? current.map((item) => ({ ...item })) : [];
    void privateLoad();
  },
  hide() {
    visible.value = false;
  },
});
watch(visible, (value) => {
  if (!value) {
    epoch += 1;
    request += 1;
    pending.clear();
    completed.clear();
    loading.value = false;
    boundLoading.value = false;
    emits("closed");
  }
});
onBeforeUnmount(() => {
  epoch += 1;
  request += 1;
  pending.clear();
  completed.clear();
});
</script>
