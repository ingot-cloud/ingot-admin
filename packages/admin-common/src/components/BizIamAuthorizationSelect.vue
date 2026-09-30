<template>
  <div class="flex flex-col gap-8px w-full">
    <el-select
      v-model="model"
      :multiple="multiple"
      :disabled="disabled || !supported"
      filterable
      remote
      :debounce="0"
      clearable
      :remote-method="search"
      :loading="loading"
      :placeholder="placeholder"
      class="w-full"
      @visible-change="onOpen"
      @change="onChange"
    >
      <el-option v-for="option in options" :key="option.id" :value="option.id" :label="option.name">
        <div>{{ option.name }}</div>
      </el-option>
      <template v-if="hasMore" #footer>
        <in-button :loading="loading" @click="load(page + 1, keyword, true)">加载更多</in-button>
      </template>
    </el-select>
    <el-alert v-if="!supported" type="warning" :closable="false" :title="unavailableMessage" />
  </div>
</template>
<script setup lang="ts">
import { useCapabilities } from "@ingot/admin-core";
import { iamEditorFailure } from "../hooks/iamEditorFailure";
import { useIamCandidateRequests } from "../hooks/useIamCandidateRequests";
import type {
  AuthorizationCandidatesApi,
  AuthorizationCandidatePage,
  AuthorizationCandidateQuery,
  AuthorizationOption,
} from "../models/iam";
import { IAM_DEFAULT_PAGE_SIZE } from "../models/iam";
defineOptions({ name: "BizIamAuthorizationSelect" });
const SEARCH_DEBOUNCE_MS = 300;
const props = withDefaults(
  defineProps<{
    api: AuthorizationCandidatesApi;
    query: AuthorizationCandidateQuery;
    multiple?: boolean;
    disabled?: boolean;
    placeholder?: string;
    initialOptions?: AuthorizationOption[];
    initialPage?: AuthorizationCandidatePage;
    resetKey?: string | number;
  }>(),
  { placeholder: "请选择", initialOptions: () => [] },
);
const model = defineModel<string | string[]>({ default: "" });
const emits = defineEmits<{
  options: [items: AuthorizationOption[]];
  change: [items: AuthorizationOption[]];
}>();
const options = ref<AuthorizationOption[]>([]);
const loading = ref(false);
const supported = ref(true);
const unavailableMessage = ref("");
const keyword = ref("");
const page = ref(0);
const total = ref(0);
const { contextEpoch } = useCapabilities();
const requests = useIamCandidateRequests(() => props.api);
let opened = false;
let searchTimer: ReturnType<typeof setTimeout> | undefined;
let resolving = "";
let request = 0;
let epoch = 0;
let consumedInitialPage: AuthorizationCandidatePage | undefined;
const hasMore = computed(() => page.value * IAM_DEFAULT_PAGE_SIZE < total.value);
const selectedIds = (): string[] =>
  Array.isArray(model.value) ? model.value : model.value ? [model.value] : [];
const merge = (items: AuthorizationOption[]): void => {
  const byId = new Map(options.value.map((item) => [item.id, item]));
  items.forEach((item) => byId.set(item.id, item));
  options.value = [...byId.values()];
  emits("options", items);
};
const resolveSelected = async (): Promise<void> => {
  const ids = selectedIds();
  const currentEpoch = epoch;
  const selection = JSON.stringify(ids);
  const valid = new Set(
    options.value.filter((option) => ids.includes(option.id)).map((option) => option.id),
  );
  const missing = ids.filter((id) => !valid.has(id));
  const key = `${currentEpoch}:${selection}`;
  if (!missing.length || props.disabled || resolving === key) return;
  resolving = key;
  try {
    for (let start = 0; start < missing.length; start += IAM_DEFAULT_PAGE_SIZE) {
      const response = await requests.request({
        ...props.query,
        ids: missing.slice(start, start + IAM_DEFAULT_PAGE_SIZE),
        page: 1,
        pageSize: IAM_DEFAULT_PAGE_SIZE,
      });
      if (epoch !== currentEpoch || selection !== JSON.stringify(selectedIds())) return;
      response.data.items.forEach((item) => valid.add(item.id));
      merge(response.data.items);
    }
    if (!props.disabled && ids.some((id) => !valid.has(id))) {
      const retained = ids.filter((id) => valid.has(id));
      model.value = Array.isArray(model.value) ? retained : retained[0] || "";
      onChange();
    }
  } catch (error) {
    if (epoch === currentEpoch) await iamEditorFailure(error);
  } finally {
    if (resolving === key) resolving = "";
  }
};
const load = async (current: number, query: string, append = false): Promise<void> => {
  if (props.disabled) return;
  const id = ++request;
  const currentEpoch = epoch;
  loading.value = true;
  try {
    const initial =
      current === 1 && !query && props.initialPage !== consumedInitialPage
        ? props.initialPage
        : undefined;
    if (initial) consumedInitialPage = initial;
    const data =
      initial ||
      (
        await requests.request({
          ...props.query,
          keyword: query,
          page: current,
          pageSize: IAM_DEFAULT_PAGE_SIZE,
        })
      ).data;
    if (id !== request || currentEpoch !== epoch) return;
    supported.value = data.supported;
    unavailableMessage.value = data.unavailableMessage || "该资源暂不支持对象查询";
    const selected = options.value.filter((item) => selectedIds().includes(item.id));
    if (!append) options.value = selected;
    merge(data.items);
    page.value = current;
    total.value = data.total;
  } catch (error) {
    if (id === request && currentEpoch === epoch) await iamEditorFailure(error);
  } finally {
    if (id === request) loading.value = false;
  }
};
const search = (query: string): void => {
  const value = query.trim();
  if (props.disabled || (!opened && !value)) return;
  if (value === keyword.value && (loading.value || page.value > 0)) return;
  privateCancelSearch();
  keyword.value = value;
  page.value = 0;
  total.value = 0;
  request += 1;
  loading.value = false;
  if (!value) {
    void load(1, value);
    return;
  }
  searchTimer = setTimeout(() => {
    searchTimer = undefined;
    void load(1, value);
  }, SEARCH_DEBOUNCE_MS);
};
const onOpen = (open: boolean): void => {
  if (open) {
    opened = true;
    if (!page.value) void load(1, keyword.value);
    return;
  }
  opened = false;
  privateReset(false);
};
const onChange = (): void =>
  emits(
    "change",
    options.value.filter((item) => selectedIds().includes(item.id)),
  );
const privateCancelSearch = (): void => {
  if (searchTimer !== undefined) clearTimeout(searchTimer);
  searchTimer = undefined;
};
const privateSeed = (): void => {
  const ids = selectedIds();
  const items = props.initialOptions.filter((option) => ids.includes(option.id));
  if (items.length) merge(items);
};
const privateReset = (clearSelection: boolean): void => {
  privateCancelSearch();
  epoch += 1;
  request += 1;
  requests.reset();
  consumedInitialPage = props.initialPage;
  resolving = "";
  options.value = clearSelection
    ? []
    : options.value.filter((option) => selectedIds().includes(option.id));
  privateSeed();
  page.value = 0;
  total.value = 0;
  keyword.value = "";
  supported.value = true;
  unavailableMessage.value = "";
  loading.value = false;
};
watch(() => props.initialOptions, privateSeed, { deep: true, immediate: true });
watch(
  () => [JSON.stringify(props.query), props.resetKey],
  () => {
    privateReset(true);
    void resolveSelected();
    if (opened && !props.disabled) void load(1, "");
  },
);
watch(contextEpoch, () => {
  opened = false;
  privateReset(true);
});
watch(
  () => props.disabled,
  (disabled) => {
    if (disabled) {
      opened = false;
      privateReset(false);
    } else void resolveSelected();
  },
);
watch(
  model,
  () => {
    if (selectedIds().some((id) => !options.value.some((item) => item.id === id)))
      void resolveSelected();
  },
  { deep: true },
);
onMounted(() => {
  void resolveSelected();
});
onBeforeUnmount(() => {
  privateReset(true);
});
</script>
