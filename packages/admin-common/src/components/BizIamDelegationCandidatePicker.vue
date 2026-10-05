<template>
  <div v-bind="$attrs" class="flex flex-col gap-6px w-full">
    <button
      type="button"
      :disabled="disabled || opening"
      :aria-label="placeholder"
      class="flex items-center gap-8px box-border w-full min-h-[var(--in-control-height)] px-11px py-6px border border-solid border-[var(--el-border-color)] rounded-[var(--el-border-radius-base)] bg-[var(--el-fill-color-blank)] text-left"
      :class="
        disabled
          ? 'cursor-not-allowed opacity-60'
          : 'cursor-pointer hover:border-[var(--el-color-primary)]'
      "
      @click="privateOpen"
    >
      <span
        class="flex-1 min-w-0 truncate"
        :class="
          selectedIds.length
            ? 'text-[var(--el-text-color-regular)]'
            : 'text-[var(--in-text-color-placeholder)]'
        "
      >
        {{ selectedLabel }}
      </span>
      <in-icon name="ep:edit" class="shrink-0 text-[var(--el-text-color-secondary)]" />
    </button>
    <span v-if="unavailableMessage" class="text-12px text-[var(--el-color-warning)]">{{
      unavailableMessage
    }}</span>
  </div>
  <biz-iam-member-picker-dialog
    v-if="multiple"
    ref="multiDialog"
    :title="title"
    :search-placeholder="searchPlaceholder"
    :show-avatar="query.kind === 'MEMBER'"
    :selected-unit="query.kind === 'MEMBER' ? '名成员' : '个对象'"
    :empty-text="unavailableMessage || '暂无可选内容'"
    :load-members="privateLoadMulti"
    :load-bound="loadSelected ? privateLoadBound : undefined"
    @confirm="privateConfirmMulti"
    @load-error="iamEditorFailure"
  />
  <biz-iam-tree-candidate-dialog
    ref="treeDialog"
    :api="api"
    :query="query"
    :title="title"
    :search-placeholder="searchPlaceholder"
    :multiple="multiple"
    :load-selected="loadSelected"
    @confirm="privateConfirmTree"
  />
  <in-dialog
    v-if="!multiple"
    v-model="visible"
    :title="title"
    width="600px"
    layout="pinned"
    append-to-body
  >
    <div class="h-420px flex flex-col min-w-0">
      <el-input v-model="keyword" clearable :placeholder="searchPlaceholder" @input="privateSearch">
        <template #prefix><in-icon name="ep:search" /></template>
      </el-input>
      <in-loading :loading="loading" class="flex-1 min-h-0 overflow-auto py-8px">
        <el-alert
          v-if="unavailableMessage"
          type="warning"
          :closable="false"
          :title="unavailableMessage"
        />
        <div v-else-if="failed" class="flex items-center gap-8px py-16px">
          <span>加载失败</span
          ><in-button type="primary" link @in-click="privateLoadSingle">重试</in-button>
        </div>
        <template v-else>
          <button
            v-for="item in items"
            :key="item.id"
            type="button"
            :aria-pressed="draft?.id === item.id"
            class="flex items-center gap-8px w-full py-9px px-8px text-left border-none rounded-[var(--el-border-radius-base)] bg-transparent cursor-pointer text-[var(--el-text-color-regular)] hover:bg-[var(--el-fill-color-light)]"
            @click="draft = item"
          >
            <in-icon :name="draft?.id === item.id ? 'ep:circle-check-filled' : 'ep:circle-check'" />
            <span class="truncate">{{ item.name }}</span>
          </button>
          <div
            v-if="!items.length && !loading"
            class="py-16px text-[var(--el-text-color-secondary)]"
          >
            暂无可选内容
          </div>
        </template>
      </in-loading>
      <el-pagination
        v-if="total > IAM_DEFAULT_PAGE_SIZE"
        class="shrink-0 justify-end pt-8px"
        :current-page="page"
        :page-size="IAM_DEFAULT_PAGE_SIZE"
        :total="total"
        layout="prev, pager, next"
        size="small"
        @current-change="privatePage"
      />
    </div>
    <template #footer>
      <in-button @in-click="visible = false">取消</in-button>
      <in-button v-if="selectedIds.length" @in-click="privateClear">清除选择</in-button>
      <in-button
        type="primary"
        :disabled="!draft || loading || !!unavailableMessage"
        @in-click="privateConfirmSingle"
        >确定</in-button
      >
    </template>
  </in-dialog>
</template>

<script setup lang="ts">
import { type LoadDataParams, type Page } from "@ingot/admin-core";
import { iamEditorFailure } from "../hooks/iamEditorFailure";
import {
  IAM_DEFAULT_PAGE_SIZE,
  type AuthorizationCandidatesApi,
  type AuthorizationCandidateQuery,
  type IamSelectOption,
  type AuthorizationOption,
} from "../models/iam";
import BizIamMemberPickerDialog from "./BizIamMemberPickerDialog.vue";
import BizIamTreeCandidateDialog from "./BizIamTreeCandidateDialog.vue";

defineOptions({ name: "BizIamDelegationCandidatePicker", inheritAttrs: false });
const props = defineProps<{
  api: AuthorizationCandidatesApi;
  query: AuthorizationCandidateQuery;
  title: string;
  placeholder: string;
  searchPlaceholder: string;
  multiple?: boolean;
  disabled?: boolean;
  selectedOptions?: AuthorizationOption[];
  loadSelected?: AuthorizationCandidatesApi;
  resetKey?: string | number;
}>();
const emits = defineEmits<{
  selection: [items: IamSelectOption[]];
  /** 用户确认的完整选择快照，不由名称回显触发。 */
  confirm: [items: IamSelectOption[]];
}>();
const model = defineModel<string | string[]>({ default: "" });
const multiDialog = ref<InstanceType<typeof BizIamMemberPickerDialog>>();
const treeDialog = ref<InstanceType<typeof BizIamTreeCandidateDialog>>();
const known = ref<Record<string, AuthorizationOption>>({});
const visible = ref(false);
const opening = ref(false);
const keyword = ref("");
const items = ref<IamSelectOption[]>([]);
const draft = ref<IamSelectOption>();
const page = ref(1);
const total = ref(0);
const loading = ref(false);
const failed = ref(false);
const unavailableMessage = ref("");
let epoch = 0;
let acceptProvidedOptions = true;
let request = 0;
let hydrationRequest = 0;
let timer: ReturnType<typeof setTimeout> | undefined;
const selectedIds = computed(() =>
  Array.isArray(model.value) ? model.value : model.value ? [model.value] : [],
);
const selectedLabel = computed(() => {
  if (!selectedIds.value.length) return props.placeholder;
  const names = selectedIds.value.map((id) => known.value[id]?.name).filter(Boolean);
  if (!names.length) return `已选 ${selectedIds.value.length} 项`;
  const missing = selectedIds.value.length - names.length;
  return names.join("、") + (missing ? ` 等 ${selectedIds.value.length} 项` : "");
});
let hydration: Promise<IamSelectOption[]> | undefined;
let hydrationKey = "";
const privateHydrate = (refresh = false): Promise<IamSelectOption[]> => {
  const key = `${epoch}:${selectedIds.value.join(",")}`;
  if (hydration && hydrationKey === key) return hydration;
  hydrationKey = key;
  const pending = privateResolveSelected(refresh);
  hydration = pending;
  void pending
    .finally(() => {
      if (hydration === pending) hydration = undefined;
    })
    .catch(() => {});
  return pending;
};
const privateResolveSelected = async (refresh = false): Promise<IamSelectOption[]> => {
  const current = epoch;
  const currentRequest = ++hydrationRequest;
  const ids = [...new Set(selectedIds.value)];
  for (const item of props.selectedOptions || [])
    if (acceptProvidedOptions && ids.includes(item.id) && !item.labelPending)
      known.value[item.id] = item;
  if (props.loadSelected && props.multiple) return ids.flatMap((id) => known.value[id] || []);
  if (!refresh && ids.every((id) => known.value[id])) {
    const selected = ids.map((id) => known.value[id]);
    emits("selection", selected);
    return selected;
  }
  const resolved: IamSelectOption[] = [];
  for (let offset = 0; offset < ids.length; offset += IAM_DEFAULT_PAGE_SIZE) {
    const batch = ids.slice(offset, offset + IAM_DEFAULT_PAGE_SIZE);
    const response = await props.api({
      ...props.query,
      ids: batch,
      page: 1,
      pageSize: IAM_DEFAULT_PAGE_SIZE,
    });
    if (current !== epoch || currentRequest !== hydrationRequest) return [];
    if (!response.data.supported) {
      ids.forEach((id) => delete known.value[id]);
      unavailableMessage.value = response.data.unavailableMessage || "该资源暂不支持对象查询";
      return [];
    }
    const allowed = new Set(batch);
    for (const item of response.data.items.filter((value) => allowed.has(value.id))) {
      const option = { ...item };
      known.value[item.id] = option;
      resolved.push(option);
    }
  }
  const resolvedIds = new Set(resolved.map((item) => item.id));
  ids.filter((id) => !resolvedIds.has(id)).forEach((id) => delete known.value[id]);
  if (resolved.length !== ids.length) unavailableMessage.value = "部分已选对象不可用，请重新选择";
  emits("selection", resolved);
  return resolved;
};
const privateLoadMulti = async (params: LoadDataParams): Promise<Page<IamSelectOption>> => {
  const current = epoch;
  const response = await props.api({
    ...props.query,
    keyword: params.query,
    page: params.current,
    pageSize: params.size,
  });
  if (current !== epoch)
    return { records: [], total: 0, current: params.current, size: params.size };
  if (!response.data.supported) {
    unavailableMessage.value = response.data.unavailableMessage || "该资源暂不支持对象查询";
    return { records: [], total: 0, current: params.current, size: params.size };
  }
  const records = response.data.items.map((item) => ({ ...item }));
  for (const item of records) known.value[item.id] = item;
  return {
    records,
    total: response.data.total,
    current: response.data.page,
    size: response.data.pageSize,
  };
};
const privateLoadBound = async (params: LoadDataParams): Promise<Page<IamSelectOption>> => {
  const current = epoch;
  const response = await props.loadSelected!({
    ...props.query,
    page: params.current,
    pageSize: params.size,
  });
  if (current !== epoch)
    return { records: [], total: 0, current: params.current, size: params.size };
  response.data.items.forEach((item) => {
    known.value[item.id] = item;
  });
  return {
    records: response.data.items,
    total: response.data.total,
    current: response.data.page,
    size: response.data.pageSize,
  };
};
const privateLoadSingle = async (): Promise<void> => {
  const current = ++request;
  loading.value = true;
  failed.value = false;
  try {
    const response = await props.api({
      ...props.query,
      keyword: keyword.value.trim(),
      page: page.value,
      pageSize: IAM_DEFAULT_PAGE_SIZE,
    });
    if (current !== request || !visible.value) return;
    unavailableMessage.value = response.data.supported
      ? ""
      : response.data.unavailableMessage || "该资源暂不支持对象查询";
    items.value = response.data.items.map((item) => ({ ...item }));
    response.data.items.forEach((item) => {
      known.value[item.id] = item;
    });
    total.value = response.data.total;
  } catch (error) {
    if (current === request) {
      failed.value = true;
      await iamEditorFailure(error);
    }
  } finally {
    if (current === request) loading.value = false;
  }
};
const privateOpen = async (): Promise<void> => {
  if (props.disabled || opening.value) return;
  const current = epoch;
  opening.value = true;
  unavailableMessage.value = "";
  try {
    const selected = await privateHydrate();
    if (current !== epoch || props.disabled) return;
    let firstPage: import("../models/iam").AuthorizationCandidatePage | undefined;
    if (props.query.kind === "OBJECT") {
      const response = await props.api({
        ...props.query,
        tree: true,
        page: 1,
        pageSize: IAM_DEFAULT_PAGE_SIZE,
      });
      if (current !== epoch || props.disabled) return;
      firstPage = response.data;
      if (!firstPage.supported) {
        unavailableMessage.value = firstPage.unavailableMessage || "该资源暂不支持对象查询";
        return;
      }
      firstPage.items.forEach((item) => {
        known.value[item.id] = item;
      });
      if (firstPage.hierarchical) {
        treeDialog.value?.show(
          selected,
          firstPage,
          props.loadSelected && selected.length !== selectedIds.value.length
            ? selectedIds.value
            : undefined,
        );
        return;
      }
    }
    if (props.multiple) {
      const initial = firstPage
        ? {
            records: firstPage.items,
            total: firstPage.total,
            current: firstPage.page,
            size: firstPage.pageSize,
          }
        : undefined;
      const currentSelection =
        props.loadSelected && selected.length !== selectedIds.value.length
          ? { boundIds: [...selectedIds.value] }
          : selected;
      multiDialog.value?.show(currentSelection, initial);
    } else {
      draft.value = selected[0];
      keyword.value = "";
      page.value = 1;
      visible.value = true;
      if (firstPage) {
        items.value = firstPage.items;
        total.value = firstPage.total;
      } else await privateLoadSingle();
    }
  } catch (error) {
    await iamEditorFailure(error);
  } finally {
    if (current === epoch) opening.value = false;
  }
};
const privateConfirmMulti = (selected: IamSelectOption[]): void => {
  for (const item of selected) if (!item.labelPending) known.value[item.id] = item;
  model.value = selected.map(({ id }) => id);
  emits("selection", selected);
  emits("confirm", selected);
  unavailableMessage.value = "";
};
const privateConfirmTree = (selected: AuthorizationOption[]): void => {
  for (const item of selected) if (!item.labelPending) known.value[item.id] = item;
  model.value = props.multiple ? selected.map((item) => item.id) : selected[0]?.id || "";
  emits("selection", selected);
  emits("confirm", selected);
  unavailableMessage.value = "";
};
const privateConfirmSingle = (): void => {
  if (!draft.value) return;
  known.value[draft.value.id] = draft.value;
  model.value = draft.value.id;
  emits("selection", [draft.value]);
  emits("confirm", [draft.value]);
  visible.value = false;
  unavailableMessage.value = "";
};
const privateClear = (): void => {
  model.value = "";
  emits("selection", []);
  emits("confirm", []);
  draft.value = undefined;
  visible.value = false;
};
const privateSearch = (): void => {
  if (timer) clearTimeout(timer);
  request += 1;
  page.value = 1;
  timer = setTimeout(() => void privateLoadSingle(), 300);
};
const privatePage = (next: number): void => {
  page.value = next;
  void privateLoadSingle();
};
watch(visible, (value) => {
  if (value) return;
  if (timer) clearTimeout(timer);
  request += 1;
  loading.value = false;
});
watch(
  () => `${JSON.stringify(props.query)}:${props.resetKey || ""}`,
  () => {
    epoch += 1;
    acceptProvidedOptions = false;
    request += 1;
    if (timer) clearTimeout(timer);
    loading.value = false;
    opening.value = false;
    known.value = {};
    unavailableMessage.value = "";
    visible.value = false;
    multiDialog.value?.hide();
    treeDialog.value?.hide();
    if (selectedIds.value.length) void privateHydrate().catch(iamEditorFailure);
  },
);
watch(
  () => `${selectedIds.value.join(",")}:${JSON.stringify(props.selectedOptions || [])}`,
  () => {
    if (selectedIds.value.length) void privateHydrate().catch(iamEditorFailure);
  },
  { immediate: true },
);
onBeforeUnmount(() => {
  epoch += 1;
  request += 1;
  if (timer) clearTimeout(timer);
});
</script>
