<template>
  <in-selection-field
    :items="selectedItems"
    :placeholder="placeholder"
    :disabled="disabled"
    @click="privateOpen"
  />
  <in-dialog
    v-model="visible"
    title="选择全局账号"
    width="min(840px, calc(100vw - 32px))"
    layout="pinned"
    append-to-body
  >
    <div class="in-split-picker h-420px max-h-[55vh] flex">
      <section aria-label="候选账号" class="flex w-1/2 min-w-0 flex-col overflow-hidden">
        <div class="flex flex-col gap-8px p-12px sm:flex-row">
          <el-input
            v-model="username"
            aria-label="登录名"
            clearable
            placeholder="请输入完整登录名"
            @keydown.enter.prevent="privateSearch"
          >
            <template #prefix><in-icon name="ep:search" /></template>
          </el-input>
          <in-button class="shrink-0" :disabled="!loginName || loading" @in-click="privateSearch">
            查询
          </in-button>
        </div>
        <div
          v-if="errorMessage && !loading"
          role="status"
          class="px-12px pb-8px text-[var(--el-text-color-secondary)]"
        >
          {{ errorMessage }}
          <in-button v-if="failedPage" type="primary" link @in-click="privateLoadPage(failedPage)"
            >重试</in-button
          >
          <in-button
            v-else-if="notFound && forPlatformMember"
            type="primary"
            link
            @in-click="privateCreateAccount"
          >
            前往创建全局账号
          </in-button>
        </div>
        <in-loading :loading="loading" class="flex-1 overflow-hidden">
          <div class="overflow-auto px-12px">
            <el-radio
              v-for="candidate in candidates"
              :key="candidate.id"
              :model-value="picked?.record.id"
              :value="candidate.id"
              :disabled="loading"
              class="mr-0! h-auto! w-full min-w-0 py-8px [&_.el-radio__label]:min-w-0"
              @update:model-value="privatePick(candidate)"
            >
              <span class="flex min-w-0 items-center gap-8px">
                <in-avatar :name="candidate.username" :show-name="false" />
                <span class="truncate" :title="candidate.username">{{ candidate.username }}</span>
              </span>
            </el-radio>
            <div
              v-if="!candidates.length && !loading && !errorMessage"
              role="status"
              class="py-16px text-[var(--el-text-color-secondary)]"
            >
              {{ emptyText }}
            </div>
          </div>
        </in-loading>
        <el-pagination
          v-if="!loginName && (accountPage.total ?? 0) > IAM_DEFAULT_PAGE_SIZE"
          :current-page="accountPage.current ?? 1"
          :page-size="IAM_DEFAULT_PAGE_SIZE"
          :total="accountPage.total"
          :pager-count="5"
          :disabled="loading"
          layout="prev, pager, next"
          size="small"
          class="shrink-0 overflow-x-auto px-8px py-8px sm:justify-end"
          @current-change="privateLoadPage"
        />
      </section>
      <section aria-label="已选账号" class="flex w-1/2 min-w-0 flex-col overflow-hidden">
        <div class="flex shrink-0 items-center justify-between gap-8px px-12px py-12px">
          <span>已选：{{ picked ? 1 : 0 }} 个账号</span>
          <in-button type="primary" link :disabled="!picked" @in-click="picked = undefined"
            >清空</in-button
          >
        </div>
        <div class="flex-1 min-h-0 overflow-auto px-12px pb-12px">
          <div v-if="picked" class="flex items-center gap-8px py-8px">
            <in-avatar :name="picked.record.username" :show-name="false" />
            <span class="flex-1 truncate" :title="picked.record.username">{{
              picked.record.username
            }}</span>
            <in-close-button
              class="shrink-0"
              size="sm"
              :label="`移除 ${picked.record.username}`"
              @click="picked = undefined"
            />
          </div>
        </div>
      </section>
    </div>
    <template #footer>
      <in-button @in-click="visible = false">取消</in-button>
      <in-button type="primary" :disabled="!picked || loading" @in-click="privateConfirm"
        >确定</in-button
      >
    </template>
  </in-dialog>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import {
  InSelectionField,
  isApiError,
  silentQueryRequest,
  useCapabilities,
  type Page,
  type R,
} from "@ingot/admin-core";
import {
  AccountLookupPurpose,
  AuthorizationDomain,
  IAM_DEFAULT_PAGE_SIZE,
  IamAction,
  type AccountRecord,
  type ResourceDetail,
} from "@ingot/admin-common";
import { PlatformAccountLookupAPI, PlatformAccountPageAPI } from "@/api/iam/accounts";

defineOptions({ name: "BizPlatformAccountSelect" });

const props = withDefaults(
  defineProps<{ placeholder?: string; disabled?: boolean; forPlatformMember?: boolean }>(),
  { placeholder: "请选择全局账号" },
);
const selected = defineModel<ResourceDetail<AccountRecord>>();
const emits = defineEmits<{ "create-account": [username: string] }>();
const { hasAction, contextEpoch } = useCapabilities();

type AccountChoice = Pick<AccountRecord, "id" | "username">;
const OBJECT_NOT_FOUND = "ObjectNotFound";
const visible = ref(false);
const username = ref("");
const loginName = computed(() => username.value.trim());
const canBrowse = computed(() => hasAction(IamAction.PLATFORM_ACCOUNT_READ));
const loading = ref(false);
const accountPage = ref<Page<AccountChoice>>({});
const exactMatch = ref<ResourceDetail<AccountRecord>>();
const picked = ref<ResourceDetail<AccountRecord>>();
const errorMessage = ref("");
const failedPage = ref<number>();
const notFound = ref(false);
let pendingRequest: AbortController | undefined;

const candidates = computed(() => {
  if (loginName.value) return exactMatch.value ? [exactMatch.value.record] : [];
  return accountPage.value.records ?? [];
});
const emptyText = computed(() =>
  loginName.value || !canBrowse.value ? "按完整登录名精确查询全局账号" : "暂无全局账号",
);

const selectedItems = computed(() => {
  const account = selected.value?.record;
  return account ? [{ id: account.id, name: account.username }] : [];
});

const resetSearch = (): void => {
  pendingRequest?.abort();
  pendingRequest = undefined;
  loading.value = false;
  accountPage.value = {};
  exactMatch.value = undefined;
  errorMessage.value = "";
  failedPage.value = undefined;
  notFound.value = false;
};

const load = async <T,>(
  fetch: (signal: AbortSignal) => Promise<R<T>>,
  apply: (data: T) => void,
  fail: (error: unknown) => void,
): Promise<void> => {
  pendingRequest = new AbortController();
  const { signal } = pendingRequest;
  errorMessage.value = "";
  failedPage.value = undefined;
  notFound.value = false;
  loading.value = true;
  try {
    const { data } = await fetch(signal);
    if (!signal.aborted) apply(data);
  } catch (error: unknown) {
    if (!signal.aborted) fail(error);
  } finally {
    if (!signal.aborted) {
      loading.value = false;
      pendingRequest = undefined;
    }
  }
};

const privateLoadPage = (current: number): void => {
  if (!visible.value || !canBrowse.value || loginName.value || loading.value) return;
  void load(
    (signal) =>
      PlatformAccountPageAPI(
        { current, size: IAM_DEFAULT_PAGE_SIZE },
        props.forPlatformMember ? { excludePlatformMembers: true } : undefined,
        silentQueryRequest(signal),
      ),
    (data) => {
      accountPage.value = {
        ...data,
        records: data.records?.map(({ record: { id, username } }) => ({ id, username })),
      };
    },
    () => {
      failedPage.value = current;
      errorMessage.value = "账号列表加载失败，请重试";
    },
  );
};

const privateOpen = (): void => {
  username.value = "";
  picked.value = selected.value;
  visible.value = true;
  privateLoadPage(1);
};

const lookup = (name: string, expectedId?: string): void => {
  if (!visible.value || loading.value || !name) return;
  exactMatch.value = undefined;
  void load(
    (signal) =>
      PlatformAccountLookupAPI(
        {
          purpose: AccountLookupPurpose.MEMBER_CREATE,
          username: name,
          ...(props.forPlatformMember ? { domain: AuthorizationDomain.PLATFORM } : {}),
        },
        silentQueryRequest(signal),
      ),
    (data) => {
      if (expectedId && expectedId !== data.record.id) {
        errorMessage.value = "账号已变化，请重新查询";
        return;
      }
      if (expectedId) picked.value = data;
      else {
        exactMatch.value = data;
        if (picked.value?.record.id === data.record.id) picked.value = data;
      }
    },
    (error) => {
      const missing = isApiError(error) && error.code === OBJECT_NOT_FOUND;
      const message =
        isApiError(error) && (error.kind === "business" ? error.message : error.response?.message);
      errorMessage.value = missing ? "未找到该登录名" : message || "账号查询失败，请重试";
      notFound.value = !expectedId && missing;
      if (picked.value?.record.username === name) picked.value = undefined;
    },
  );
};

const privateSearch = (): void => lookup(loginName.value);

const privatePick = (candidate: AccountChoice): void => {
  if (exactMatch.value?.record.id === candidate.id) picked.value = exactMatch.value;
  else lookup(candidate.username, candidate.id);
};

const privateConfirm = (): void => {
  if (!visible.value || loading.value || !picked.value) return;
  selected.value = picked.value;
  visible.value = false;
};

const privateCreateAccount = (): void => {
  const loginName = username.value.trim();
  visible.value = false;
  emits("create-account", loginName);
};

watch(
  loginName,
  (name) => {
    resetSearch();
    if (!name) privateLoadPage(1);
  },
  { flush: "sync" },
);
watch(
  visible,
  (open) => {
    if (open) return;
    resetSearch();
    picked.value = undefined;
  },
  { flush: "sync" },
);
watch(
  () => props.disabled,
  (disabled) => {
    if (disabled) visible.value = false;
  },
);
watch([contextEpoch, canBrowse], () => {
  visible.value = false;
});
onBeforeUnmount(() => pendingRequest?.abort());
</script>
