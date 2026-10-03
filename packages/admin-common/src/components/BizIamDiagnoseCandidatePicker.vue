<template>
  <button
    type="button"
    :disabled="disabled"
    :aria-label="placeholder"
    class="flex items-center gap-8px box-border w-full h-[var(--in-control-height)] px-11px border border-solid border-[var(--el-border-color)] rounded-[var(--el-border-radius-base)] bg-[var(--el-fill-color-blank)] text-left outline-none"
    :class="
      disabled
        ? 'cursor-not-allowed opacity-60'
        : 'cursor-pointer hover:border-[var(--el-color-primary)] focus-visible:border-[var(--el-color-primary)]'
    "
    @click="privateOpen"
  >
    <span
      class="flex-1 min-w-0 truncate"
      :class="
        selected ? 'text-[var(--el-text-color-regular)]' : 'text-[var(--in-text-color-placeholder)]'
      "
    >
      {{ selected ? privateLabel(selected) : placeholder }}
    </span>
    <in-icon name="ep:search" class="shrink-0 text-[var(--el-text-color-secondary)]" />
  </button>
  <in-dialog v-model="visible" :title="title" width="600px" append-to-body>
    <div class="h-420px flex flex-col min-w-0">
      <el-input
        v-model="keyword"
        clearable
        :placeholder="
          query.kind === 'ACTION' ? '搜索资源或操作' : `搜索${title.replace('选择', '')}`
        "
        @input="privateSearch"
      >
        <template #prefix><in-icon name="ep:search" /></template>
      </el-input>
      <div v-loading="loading" class="flex-1 min-h-0 overflow-auto py-8px">
        <el-alert v-if="!supported" type="warning" :closable="false" :title="unavailableMessage" />
        <div v-else-if="failed" class="flex items-center gap-8px py-16px">
          <span>加载失败</span
          ><in-button type="primary" link @in-click="privateLoad">重试</in-button>
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
            <span class="truncate">{{ privateLabel(item) }}</span>
          </button>
          <div
            v-if="!items.length && !loading"
            class="py-16px text-[var(--el-text-color-secondary)]"
          >
            暂无可选内容
          </div>
        </template>
      </div>
      <el-pagination
        v-if="supported && total > IAM_DEFAULT_PAGE_SIZE"
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
      <in-button v-if="model" @in-click="privateClear">清除选择</in-button>
      <in-button
        type="primary"
        :disabled="!draft || !supported || loading"
        @in-click="privateConfirm"
        >确定</in-button
      >
    </template>
  </in-dialog>
</template>

<script setup lang="ts">
import { useCapabilities } from "@ingot/admin-core";
import { iamEditorFailure } from "../hooks/iamEditorFailure";
import { useIamCandidateRequests } from "../hooks/useIamCandidateRequests";
import {
  IAM_DEFAULT_PAGE_SIZE,
  type AuthorizationCandidatesApi,
  type AuthorizationCandidateQuery,
  type AuthorizationOption,
} from "../models/iam";

defineOptions({ name: "BizIamDiagnoseCandidatePicker" });
const props = defineProps<{
  api: AuthorizationCandidatesApi;
  query: AuthorizationCandidateQuery;
  title: string;
  placeholder: string;
  disabled?: boolean;
}>();
const model = defineModel<string>({ default: "" });
const selected = ref<AuthorizationOption | null>(null);
const draft = ref<AuthorizationOption | null>(null);
const items = ref<AuthorizationOption[]>([]);
const visible = ref(false);
const keyword = ref("");
const page = ref(1);
const total = ref(0);
const loading = ref(false);
const failed = ref(false);
const supported = ref(true);
const unavailableMessage = ref("");
const { contextEpoch } = useCapabilities();
const requests = useIamCandidateRequests(() => props.api);
let sequence = 0;
let searchTimer: ReturnType<typeof setTimeout> | undefined;
const privateLabel = (item: AuthorizationOption): string =>
  props.query.kind === "ACTION" && item.summary ? `${item.summary} / ${item.name}` : item.name;

const privateLoad = async (): Promise<void> => {
  const current = ++sequence;
  loading.value = true;
  failed.value = false;
  try {
    const response = await requests.request({
      ...props.query,
      keyword: keyword.value.trim(),
      page: page.value,
      pageSize: IAM_DEFAULT_PAGE_SIZE,
    });
    if (current !== sequence || !visible.value) return;
    items.value = response.data.items;
    total.value = response.data.total;
    supported.value = response.data.supported;
    unavailableMessage.value = response.data.unavailableMessage || "该资源暂不支持对象查询";
  } catch (error) {
    if (current === sequence) {
      failed.value = true;
      await iamEditorFailure(error);
    }
  } finally {
    if (current === sequence) loading.value = false;
  }
};
const privateOpen = (): void => {
  if (props.disabled) return;
  draft.value = selected.value;
  keyword.value = "";
  page.value = 1;
  supported.value = true;
  visible.value = true;
  void privateLoad();
};
const privateSearch = (): void => {
  if (searchTimer) clearTimeout(searchTimer);
  sequence += 1;
  loading.value = false;
  page.value = 1;
  searchTimer = setTimeout(() => {
    void privateLoad();
  }, 300);
};
const privatePage = (next: number): void => {
  page.value = next;
  void privateLoad();
};
const privateConfirm = (): void => {
  if (!draft.value) return;
  selected.value = draft.value;
  model.value = draft.value.id;
  visible.value = false;
};
const privateClear = (): void => {
  model.value = "";
  selected.value = null;
  draft.value = null;
  visible.value = false;
};
const privateReset = (clearModel: boolean): void => {
  sequence += 1;
  if (searchTimer) clearTimeout(searchTimer);
  requests.reset();
  visible.value = false;
  items.value = [];
  selected.value = null;
  draft.value = null;
  supported.value = true;
  if (clearModel) model.value = "";
};
watch(
  () => JSON.stringify(props.query),
  () => privateReset(true),
);
watch(contextEpoch, () => privateReset(true));
watch(visible, (open) => {
  if (open) return;
  sequence += 1;
  if (searchTimer) clearTimeout(searchTimer);
  requests.reset();
  loading.value = false;
});
watch(model, (value) => {
  if (!value) selected.value = null;
});
onBeforeUnmount(() => privateReset(false));
</script>
