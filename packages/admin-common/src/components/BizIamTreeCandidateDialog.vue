<template>
  <in-dialog v-model="visible" :title="title" width="840px" layout="pinned" append-to-body>
    <div class="in-split-picker h-500px flex min-w-0">
      <div
        class="w-1/2 min-w-0 flex flex-col border-r border-solid border-[var(--el-border-color)]"
      >
        <div class="p-12px">
          <el-input
            v-model="keyword"
            clearable
            :placeholder="searchPlaceholder"
            @input="privateSearch"
          >
            <template #prefix><in-icon name="ep:search" /></template>
          </el-input>
        </div>
        <in-loading :loading="loading" class="flex-1 min-h-0 overflow-auto px-12px">
          <template v-for="row in visibleRows" :key="row.key">
            <div v-if="row.more" class="py-6px" :style="{ paddingLeft: `${row.depth * 20}px` }">
              <in-button text type="primary" @in-click="privateLoad(row.parentId, true)"
                >加载更多</in-button
              >
            </div>
            <div
              v-else-if="row.item"
              class="flex items-center gap-6px min-h-36px"
              :style="{ paddingLeft: `${row.depth * 20}px` }"
            >
              <in-button
                v-if="row.item.hasChildren && !keyword"
                text
                :aria-label="expanded.has(row.item.id) ? '收起' : '展开'"
                @in-click="privateToggle(row.item.id)"
                >{{ expanded.has(row.item.id) ? "⌄" : "›" }}</in-button
              >
              <span v-else class="w-16px shrink-0" />
              <el-checkbox
                v-if="row.item.selectable !== false"
                :model-value="
                  !removedIds.has(row.item.id) &&
                  (boundIds.includes(row.item.id) ||
                    selected.some((item) => item.id === row.item?.id))
                "
                @change="privateToggleSelection(row.item!)"
              >
                <span class="truncate" :title="row.item.ancestorPath || row.item.name">
                  {{ row.item.ancestorPath || row.item.name }}
                </span>
              </el-checkbox>
              <span
                v-else
                class="truncate text-[var(--el-text-color-secondary)]"
                :title="row.item.ancestorPath || row.item.name"
              >
                {{ row.item.name }}（仅导航）
              </span>
            </div>
          </template>
          <div v-if="failed" class="py-12px">
            加载失败
            <in-button text type="primary" @in-click="privateLoad('', false)">重试</in-button>
          </div>
          <div
            v-else-if="!visibleRows.length && !loading"
            class="py-12px text-[var(--el-text-color-secondary)]"
          >
            暂无可选内容
          </div>
        </in-loading>
      </div>
      <div class="w-1/2 min-w-0 flex flex-col">
        <div class="p-12px">已选 {{ selectedCount }} 项</div>
        <div class="flex-1 min-h-0 overflow-auto px-12px">
          <div v-for="item in selected" :key="item.id" class="flex items-center gap-8px py-6px">
            <span class="flex-1 truncate">{{ item.ancestorPath || item.name }}</span>
            <in-button text type="danger" @in-click="privateRemove(item.id)">移除</in-button>
          </div>
          <in-loading v-if="boundLoading" loading class="h-80px" />
          <in-button
            v-if="boundFailed || boundItems.length < boundTotal"
            @in-click="privateLoadBound"
            >{{ boundFailed ? "加载失败，重试" : "加载更多" }}</in-button
          >
        </div>
      </div>
    </div>
    <template #footer>
      <in-button @in-click="visible = false">取消</in-button>
      <in-button type="primary" @in-click="privateConfirm">确定</in-button>
    </template>
  </in-dialog>
</template>

<script setup lang="ts">
import {
  IAM_DEFAULT_PAGE_SIZE,
  type AuthorizationCandidatesApi,
  type AuthorizationCandidateQuery,
  type AuthorizationCandidatePage,
  type AuthorizationOption,
} from "../models/iam";
import { iamEditorFailure } from "../hooks/iamEditorFailure";

defineOptions({ name: "BizIamTreeCandidateDialog" });
const props = defineProps<{
  api: AuthorizationCandidatesApi;
  query: AuthorizationCandidateQuery;
  title: string;
  searchPlaceholder: string;
  multiple?: boolean;
  loadSelected?: AuthorizationCandidatesApi;
}>();
const emits = defineEmits<{ confirm: [items: AuthorizationOption[]] }>();
const visible = ref(false);
const keyword = ref("");
const loading = ref(false);
const failed = ref(false);
const selected = ref<AuthorizationOption[]>([]);
const boundIds = ref<string[]>([]);
const removedIds = ref(new Set<string>());
const boundItems = ref<AuthorizationOption[]>([]);
const boundTotal = ref(0);
const boundPage = ref(0);
const boundLoading = ref(false);
const boundFailed = ref(false);
const selectedCount = computed(
  () =>
    new Set(
      [...boundIds.value, ...selected.value.map((item) => item.id)].filter(
        (id) => !removedIds.value.has(id),
      ),
    ).size,
);
const privateLoadBound = async (): Promise<void> => {
  if (!props.loadSelected || boundLoading.value) return;
  const current = boundRequest;
  boundLoading.value = true;
  boundFailed.value = false;
  try {
    const response = await props.loadSelected({
      ...props.query,
      page: boundPage.value + 1,
      pageSize: IAM_DEFAULT_PAGE_SIZE,
    });
    if (current !== boundRequest || !visible.value) return;
    boundItems.value.push(...response.data.items);
    boundTotal.value = response.data.total;
    boundPage.value = response.data.page;
    const known = new Map(selected.value.map((item) => [item.id, item]));
    response.data.items.forEach((item) => {
      if (!removedIds.value.has(item.id)) known.set(item.id, item);
    });
    selected.value = [...known.values()];
  } catch (error) {
    if (current === boundRequest) {
      boundFailed.value = true;
      await iamEditorFailure(error);
    }
  } finally {
    if (current === boundRequest) boundLoading.value = false;
  }
};
const expanded = ref(new Set<string>());
const branches = ref<Record<string, { items: AuthorizationOption[]; page: number; total: number }>>(
  {},
);
let request = 0;
let boundRequest = 0;
let timer: ReturnType<typeof setTimeout> | undefined;
const visibleRows = computed(() => {
  const rows: Array<{
    key: string;
    item?: AuthorizationOption;
    more?: boolean;
    parentId: string;
    depth: number;
  }> = [];
  const visit = (parentId: string, depth: number): void => {
    const branch = branches.value[parentId];
    if (!branch) return;
    for (const item of branch.items) {
      rows.push({ key: item.id, item, parentId, depth });
      if (expanded.value.has(item.id) && !keyword.value) visit(item.id, depth + 1);
    }
    if (branch.items.length < branch.total)
      rows.push({ key: `more:${parentId}`, more: true, parentId, depth });
  };
  visit("", 0);
  return rows;
});
const privateLoad = async (parentId: string, more: boolean): Promise<void> => {
  if (loading.value) return;
  const current = request;
  const prior = branches.value[parentId];
  const page = more ? (prior?.page || 0) + 1 : 1;
  loading.value = true;
  failed.value = false;
  try {
    const response = await props.api({
      ...props.query,
      tree: true,
      parentId: parentId || undefined,
      keyword: keyword.value.trim(),
      page,
      pageSize: IAM_DEFAULT_PAGE_SIZE,
    });
    if (current !== request || !visible.value) return;
    branches.value = {
      ...branches.value,
      [parentId]: {
        items: more ? [...(prior?.items || []), ...response.data.items] : response.data.items,
        page,
        total: response.data.total,
      },
    };
  } catch (error) {
    if (current === request) {
      failed.value = true;
      await iamEditorFailure(error);
    }
  } finally {
    if (current === request) loading.value = false;
  }
};
const privateToggle = (id: string): void => {
  const next = new Set(expanded.value);
  if (next.has(id)) next.delete(id);
  else {
    next.add(id);
    if (!branches.value[id]) void privateLoad(id, false);
  }
  expanded.value = next;
};
const privateToggleSelection = (item: AuthorizationOption): void => {
  if (item.selectable === false) return;
  if (
    !removedIds.value.has(item.id) &&
    (boundIds.value.includes(item.id) || selected.value.some((value) => value.id === item.id))
  )
    privateRemove(item.id);
  else {
    removedIds.value.delete(item.id);
    selected.value = props.multiple ? [...selected.value, item] : [item];
  }
};
const privateRemove = (id: string): void => {
  removedIds.value.add(id);
  selected.value = selected.value.filter((item) => item.id !== id);
};
const privateSearch = (): void => {
  if (timer) clearTimeout(timer);
  request += 1;
  loading.value = false;
  branches.value = {};
  expanded.value = new Set();
  timer = setTimeout(() => void privateLoad("", false), 250);
};
const privateConfirm = (): void => {
  const known = new Map(selected.value.map((item) => [item.id, item]));
  const ids = new Set([...boundIds.value, ...known.keys()]);
  emits(
    "confirm",
    [...ids]
      .filter((id) => !removedIds.value.has(id))
      .map((id) => known.get(id) || { id, name: id, labelPending: true }),
  );
  visible.value = false;
};
defineExpose({
  show(
    items: AuthorizationOption[],
    initialPage?: AuthorizationCandidatePage,
    persistedIds?: string[],
  ) {
    request += 1;
    boundRequest += 1;
    loading.value = false;
    if (timer) clearTimeout(timer);
    boundIds.value = persistedIds ? [...persistedIds] : [];
    removedIds.value = new Set();
    boundItems.value = [];
    boundTotal.value = 0;
    boundPage.value = 0;
    boundLoading.value = false;
    boundFailed.value = false;
    selected.value = items.map((item) => ({ ...item }));
    keyword.value = "";
    branches.value = {};
    expanded.value = new Set();
    visible.value = true;
    if (initialPage)
      branches.value[""] = {
        items: initialPage.items,
        page: initialPage.page,
        total: initialPage.total,
      };
    else void privateLoad("", false);
    if (persistedIds?.length) void privateLoadBound();
  },
  hide() {
    visible.value = false;
  },
});
watch(visible, (value) => {
  if (value) return;
  if (timer) clearTimeout(timer);
  request += 1;
  boundRequest += 1;
  loading.value = false;
  boundLoading.value = false;
});
onBeforeUnmount(() => {
  if (timer) clearTimeout(timer);
  request += 1;
  boundRequest += 1;
});
</script>
