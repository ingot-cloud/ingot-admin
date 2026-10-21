<template>
  <in-dialog
    v-model="visible"
    :title="title"
    :width="multiple ? '840px' : '600px'"
    append-to-body
    :class="{
      'iam-org-member-dialog': organization,
      'has-primary-hint': organization && showPrimary && selectedCount > 1,
    }"
  >
    <div
      v-if="organization && showPrimary && selectedCount > 1"
      class="organization-picker-hint"
      role="note"
    >
      <in-icon name="ep:info-filled" />可选择多位部门负责人，必须有一个主负责人
    </div>
    <div class="in-split-picker h-420px flex">
      <in-loading
        :loading="loading"
        :class="
          multiple
            ? 'w-1/2! min-w-0 flex flex-col overflow-hidden'
            : 'w-full! min-w-0 flex flex-col overflow-hidden'
        "
      >
        <div class="organization-picker-search p-12px">
          <el-input
            v-model="keyword"
            clearable
            :placeholder="searchPlaceholder"
            @input="organization && privateQueueSearch()"
            @keyup.enter="privateSearch"
            @clear="privateSearch"
          >
            <template #prefix>
              <in-icon name="ep:search" />
            </template>
          </el-input>
        </div>
        <nav v-if="organization" class="organization-picker-breadcrumb" aria-label="部门路径">
          <button
            type="button"
            :class="{ 'is-current': !navigation.breadcrumbs.value.length }"
            :disabled="!navigation.breadcrumbs.value.length"
            @click="privateNavigate()"
          >
            {{
              navigation.organization.value?.name ||
              (navigation.canBrowse.value ? "当前组织" : "可选成员")
            }}
          </button>
          <template v-for="(item, index) in navigation.breadcrumbs.value" :key="item.id">
            <in-icon name="ep:arrow-right" class="text-12px" />
            <span
              v-if="index === navigation.breadcrumbs.value.length - 1"
              aria-current="location"
              >{{ item.name }}</span
            >
            <button v-else type="button" @click="privateNavigate(item.id)">{{ item.name }}</button>
          </template>
        </nav>
        <span
          v-if="organization && !navigation.canBrowse.value"
          class="px-16px text-12px text-[var(--el-text-color-secondary)]"
          >无部门浏览权限，可搜索当前可选成员</span
        >
        <div v-if="multiple" class="organization-picker-all px-12px pb-8px">
          <el-checkbox
            :title="organization ? '选择当前已加载的可选成员' : undefined"
            :model-value="allPageSelected"
            :indeterminate="somePageSelected"
            :disabled="loading || boundLoading || !selectableItems.length"
            @change="privateToggleLoaded"
          >
            全选
          </el-checkbox>
        </div>
        <div
          ref="candidateScroll"
          class="organization-picker-candidates flex-1 min-h-0 overflow-auto px-12px"
          @scroll="privateScrollCandidates"
        >
          <biz-organization-member-branches
            v-if="organization"
            :navigation="navigation"
            :searching="!!keyword.trim()"
            @navigate="privateNavigate"
          />
          <label
            v-for="item in items"
            :key="item.id"
            class="organization-picker-row flex items-center gap-8px py-8px cursor-pointer"
          >
            <el-checkbox
              v-if="multiple || organization"
              :model-value="selectedIds.has(item.id)"
              :disabled="boundLoading || item.available === false"
              :aria-label="item.name"
              @change="privateToggle(item)"
            />
            <el-radio
              v-else
              :model-value="draft[0]?.id"
              :value="item.id"
              :aria-label="item.name"
              @change="privateToggle(item)"
              ><span class="sr-only">{{ item.name }}</span></el-radio
            >
            <biz-organization-picker-avatar
              v-if="organization && showAvatar"
              :src="item.avatar"
              :name="item.name"
            />
            <in-avatar
              v-else-if="showAvatar"
              :src="item.avatar"
              :name="item.name"
              :show-name="false"
            />
            <span class="truncate">{{ item.ancestorPath || item.name }}</span>
          </label>
          <div v-if="loadFailed" class="flex items-center gap-8px py-16px">
            <span class="text-[var(--el-text-color-secondary)]">加载失败</span>
            <in-button type="primary" link @in-click="privateLoad()">重试</in-button>
          </div>
          <div
            v-else-if="!items.length && !loading"
            class="text-[var(--el-text-color-secondary)] py-16px"
          >
            {{ emptyText }}
          </div>
          <biz-organization-picker-more
            v-if="organization"
            kind="members"
            label="加载更多成员"
            :has-more="canLoadMoreCandidates"
            :loading="loadingMore"
            :failed="moreFailed"
            @more="privateLoadMoreCandidates"
            @retry="privateLoad(true)"
          />
        </div>
        <el-pagination
          v-if="!organization && total > pageSize"
          class="shrink-0 justify-end px-12px py-8px"
          :current-page="page"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          size="small"
          @current-change="privateOnPageChange"
        />
      </in-loading>
      <div v-if="multiple" class="w-1/2 min-w-0 flex flex-col overflow-hidden">
        <div
          v-if="!organization || selectedCount"
          class="organization-picker-selected-header flex items-center justify-between px-12px py-12px"
        >
          <span>已选：{{ selectedCount }} {{ organization ? "名用户" : selectedUnit }}</span>
          <in-button type="primary" link @in-click="privateClear">清空</in-button>
        </div>
        <div
          class="organization-picker-selected flex-1 min-h-0 overflow-auto px-12px pb-12px"
          @scroll="privateScrollSelected"
        >
          <div
            v-for="item in rightItems"
            :key="item.id"
            class="organization-picker-row flex items-center gap-8px py-8px"
          >
            <biz-organization-picker-avatar
              v-if="organization && showAvatar"
              :src="item.avatar"
              :name="item.name"
            />
            <in-avatar
              v-else-if="showAvatar"
              :src="item.avatar"
              :name="item.name"
              :show-name="false"
            />
            <span class="flex-1 min-w-0"
              ><span class="organization-picker-name flex items-center gap-4px min-w-0"
                ><span class="truncate">{{ item.name }}</span
                ><span
                  v-if="showPrimary && primaryId === item.id"
                  class="organization-picker-primary"
                  >部门主负责人</span
                ></span
              ><span
                v-if="item.ancestorPath || item.summary"
                class="truncate block text-12px text-[var(--el-text-color-secondary)]"
                >{{ item.ancestorPath || item.summary }}</span
              ><span
                v-if="item.available === false"
                class="text-12px text-[var(--el-color-warning)]"
                >不可用，待交接</span
              ></span
            >
            <in-button
              v-if="
                showPrimary &&
                primaryId !== item.id &&
                item.available !== false &&
                !item.labelPending
              "
              link
              type="primary"
              class="organization-picker-set-primary"
              @in-click="primaryId = item.id"
              >设为部门主负责人</in-button
            >
            <in-close-button
              v-if="!organization || !item.labelPending"
              size="sm"
              :label="`移除 ${item.name}`"
              @click="privateRemove(item.id)"
            />
          </div>
          <biz-organization-picker-more
            v-if="organization"
            kind="selected"
            :has-more="canLoadMoreBound"
            :loading="boundLoading"
            :failed="boundLoadFailed"
            @more="privateLoadMoreBound"
            @retry="privateLoadBound(boundPage === 0)"
          />
          <template v-else>
            <in-loading v-if="boundLoading" loading class="h-80px" />
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
          </template>
        </div>
      </div>
    </div>
    <template #footer>
      <in-button v-if="organization && !multiple && selectedCount" @in-click="privateClear"
        >清除选择</in-button
      >
      <in-button @in-click="privateCancel">取消</in-button>
      <in-button
        type="primary"
        :disabled="
          loading || boundLoading || (showPrimary && selectedCount > 0 && !primaryId && !restricted)
        "
        @in-click="privateConfirm"
        >确定</in-button
      >
    </template>
  </in-dialog>
</template>

<script setup lang="ts">
import { InCloseButton, type LoadDataParams, type Page } from "@ingot/admin-core";
import { IAM_DEFAULT_PAGE_SIZE, type IamSelectOption } from "../models/iam";

import BizOrganizationPickerAvatar from "./BizOrganizationPickerAvatar.vue";
import BizOrganizationPickerMore from "./BizOrganizationPickerMore.vue";
import BizOrganizationMemberBranches from "./BizOrganizationMemberBranches.vue";
import {
  useOrganizationMemberNavigation,
  hasMoreOrganizationPage,
  mergeOrganizationItems,
  ORGANIZATION_PICKER_SCROLL_THRESHOLD,
  type OrganizationMemberRelation,
  type OrganizationMemberParams,
  type MemberPickerChanges,
  type OrganizationMemberBrowseLoader,
  type OrganizationMemberBrowseResult,
} from "./organizationMemberPicker";

defineOptions({ name: "BizIamMemberPickerDialog" });

export type MemberPickerShowInput = IamSelectOption[] | OrganizationMemberRelation;

const props = withDefaults(
  defineProps<{
    loadMembers: (params: LoadDataParams) => Promise<Page<IamSelectOption>>;
    loadBrowse?: OrganizationMemberBrowseLoader;
    loadBound?: (params: LoadDataParams) => Promise<Page<IamSelectOption>>;
    title?: string;
    searchPlaceholder?: string;
    emptyText?: string;
    selectedUnit?: string;
    showAvatar?: boolean;
    organization?: boolean;
    multiple?: boolean;
    showPrimary?: boolean;
    primaryMemberId?: string;
    restricted?: boolean;
    resetKey?: string | number;
  }>(),
  {
    title: "添加成员",
    searchPlaceholder: "请输入姓名",
    emptyText: "暂无成员",
    selectedUnit: "名成员",
    showAvatar: true,
    organization: false,
    multiple: true,
  },
);

const emits = defineEmits<{
  confirm: [
    members: IamSelectOption[],
    primaryMemberId?: string,
    changes?: MemberPickerChanges,
    boundPage?: Page<IamSelectOption>,
  ];
  closed: [];
  "load-error": [error: unknown];
}>();

const visible = ref(false);
const navigation = useOrganizationMemberNavigation({
  enabled: () => !!props.organization && !!props.loadBrowse,
  load: (append) => privateBrowse(append, true),
});
const candidateScroll = ref<HTMLElement>();
const loadingMore = ref(false),
  moreFailed = ref(false),
  candidateExhausted = ref(false);
const boundExhausted = ref(false),
  boundPageSize = ref(IAM_DEFAULT_PAGE_SIZE);
const primaryId = ref<string>();
const partial = ref(false);
const keyword = ref("");
const items = ref<IamSelectOption[]>([]);
const draft = ref<IamSelectOption[]>([]);
const added = ref<IamSelectOption[]>([]);
const boundItems = ref<IamSelectOption[]>([]);
const boundIdSet = ref<Set<string>>(new Set());
const removedIds = ref<Set<string>>(new Set());
const boundMode = ref(false);
const page = ref(1);
const boundPage = ref(0);
const total = ref(0);
const boundTotal = ref(0);
const loading = ref(false);
const boundLoading = ref(false);
const loadFailed = ref(false);
const boundLoadFailed = ref(false);
const pageSize = IAM_DEFAULT_PAGE_SIZE;
let epoch = 0;
let request = 0;
let searchTimer: ReturnType<typeof setTimeout> | undefined;
const pending = new Map<string, Promise<Page<IamSelectOption>>>();
const completed = new Map<string, Page<IamSelectOption>>();

const browsePending = new Map<string, Promise<OrganizationMemberBrowseResult>>();
const browseCompleted = new Map<string, OrganizationMemberBrowseResult>();
let navigationRequest = 0;

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
const selectedCount = computed(() =>
  partial.value && boundMode.value
    ? Math.max(0, boundTotal.value - removedIds.value.size + added.value.length)
    : selectedIds.value.size,
);
const rightItems = computed(() => {
  if (!boundMode.value) {
    return draft.value;
  }
  const addedIds = new Set(added.value.map((item) => item.id));
  const boundShown = boundItems.value.filter(
    (item) => !removedIds.value.has(item.id) && !addedIds.has(item.id),
  );
  return [...boundShown, ...added.value];
});
const selectableItems = computed(() => items.value.filter((item) => item.available !== false));
const allPageSelected = computed(
  () =>
    selectableItems.value.length > 0 &&
    selectableItems.value.every((item) => selectedIds.value.has(item.id)),
);
const somePageSelected = computed(
  () =>
    !allPageSelected.value && selectableItems.value.some((item) => selectedIds.value.has(item.id)),
);
const canLoadMoreCandidates = computed(
  () =>
    !candidateExhausted.value &&
    hasMoreOrganizationPage(items.value.length, total.value, page.value, pageSize),
);
const canLoadMoreBound = computed(
  () =>
    !!props.loadBound &&
    boundMode.value &&
    !boundExhausted.value &&
    hasMoreOrganizationPage(
      boundItems.value.length,
      boundTotal.value,
      boundPage.value,
      boundPageSize.value,
    ),
);

const privateApplyMembers = (
  data: Page<IamSelectOption>,
  requestedPage: number,
  append: boolean,
) => {
  const records = data.records || [];
  items.value = append ? mergeOrganizationItems(items.value, records) : records;
  total.value = data.total || 0;
  page.value = data.current || requestedPage;
  candidateExhausted.value = records.length === 0;
};

const isBoundInput = (
  value: MemberPickerShowInput,
): value is Exclude<MemberPickerShowInput, IamSelectOption[]> => !Array.isArray(value);

/** 同一请求返回导航和人员；部门加载更多只更新导航，成员翻页不丢失已展开部门页。 */
const privateBrowse = async (append = false, departmentsOnly = false): Promise<void> => {
  if (!props.loadBrowse) return;
  const id = departmentsOnly ? ++navigationRequest : ++request;
  const currentEpoch = epoch;
  const branch = navigation.parentId.value;
  const params = {
    current: !departmentsOnly && append ? page.value + 1 : page.value,
    size: pageSize,
    query: keyword.value.trim() || undefined,
    departmentId: branch,
    departmentPage: Math.max(
      1,
      departmentsOnly && append ? navigation.page.value + 1 : navigation.page.value,
    ),
  };
  const key = JSON.stringify(params);
  if (departmentsOnly) {
    navigation.loading.value = true;
    navigation.failed.value = false;
  } else if (append) {
    loadingMore.value = true;
    moreFailed.value = false;
  } else {
    loading.value = true;
    loadFailed.value = false;
    moreFailed.value = false;
  }
  const isCurrent = () =>
    epoch === currentEpoch &&
    navigation.parentId.value === branch &&
    id === (departmentsOnly ? navigationRequest : request);
  try {
    let promise = browsePending.get(key);
    if (!promise) {
      const cached = browseCompleted.get(key);
      const created = (
        cached ? Promise.resolve(cached) : Promise.resolve().then(() => props.loadBrowse!(params))
      )
        .then((data) => {
          if (currentEpoch === epoch) browseCompleted.set(key, data);
          return data;
        })
        .finally(() => {
          if (browsePending.get(key) === created) browsePending.delete(key);
        });
      promise = created;
      browsePending.set(key, promise);
    }
    const data = await promise;
    if (!isCurrent()) return;
    navigation.available.value = data.navigationAvailable;
    if (!data.navigationAvailable || departmentsOnly || navigation.page.value === 0)
      navigation.apply(data.navigation, departmentsOnly && append);
    if (!departmentsOnly) privateApplyMembers(data.members, params.current, append);
  } catch (error) {
    if (!isCurrent()) return;
    if (departmentsOnly) navigation.failed.value = true;
    else if (append) moreFailed.value = true;
    else {
      items.value = [];
      total.value = 0;
      loadFailed.value = true;
    }
    emits("load-error", error);
  } finally {
    if (isCurrent()) {
      if (departmentsOnly) navigation.loading.value = false;
      else {
        loading.value = false;
        loadingMore.value = false;
      }
    }
  }
};

const privateLoad = async (append = false): Promise<void> => {
  if (props.organization && props.loadBrowse) return privateBrowse(append);
  const id = ++request;
  const currentEpoch = epoch;
  const params: OrganizationMemberParams = {
    current: append ? page.value + 1 : page.value,
    size: pageSize,
    query: keyword.value.trim() || undefined,
    ...(props.organization && !keyword.value.trim() && navigation.parentId.value
      ? { departmentId: navigation.parentId.value }
      : {}),
  };
  const key = JSON.stringify(params);
  if (append) loadingMore.value = true;
  else loading.value = true;
  loadFailed.value = false;
  moreFailed.value = false;
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
    privateApplyMembers(data, params.current || 1, append);
  } catch (error) {
    if (epoch === currentEpoch && id === request) {
      if (append) moreFailed.value = true;
      else {
        items.value = [];
        total.value = 0;
        loadFailed.value = true;
      }
      emits("load-error", error);
    }
  } finally {
    if (epoch === currentEpoch && id === request) {
      loading.value = false;
      loadingMore.value = false;
    }
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
      size: boundPageSize.value,
    });
    const records = data.records ?? [];
    if (epoch !== currentEpoch) return;
    boundPage.value = nextPage;
    boundTotal.value = data.total ?? 0;
    boundExhausted.value = records.length === 0;
    if (partial.value)
      boundIdSet.value = new Set([...boundIdSet.value, ...records.map((item) => item.id)]);
    if (reset) {
      const names = new Map([...boundItems.value, ...records].map((item) => [item.id, item]));
      boundItems.value = [...names.values()];
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

const privateNavigate = (id?: string): void => {
  if (searchTimer) clearTimeout(searchTimer);
  if (!navigation.canBrowse.value && id) return;
  navigationRequest++;
  navigation.loading.value = false;
  navigation.failed.value = false;
  navigation.navigate(id);
  items.value = [];
  total.value = 0;
  loadingMore.value = false;
  moreFailed.value = false;
  candidateExhausted.value = false;
  if (candidateScroll.value) candidateScroll.value.scrollTop = 0;
  page.value = 1;
  keyword.value = "";
  void privateLoad();
};
const privateQueueSearch = (): void => {
  if (searchTimer) clearTimeout(searchTimer);
  request++;
  loadingMore.value = false;
  loading.value = true;
  searchTimer = setTimeout(privateSearch, 250);
};
const privateSearch = (): void => {
  if (searchTimer) clearTimeout(searchTimer);
  page.value = 1;
  items.value = [];
  total.value = 0;
  moreFailed.value = false;
  candidateExhausted.value = false;
  if (candidateScroll.value) candidateScroll.value.scrollTop = 0;
  void privateLoad();
};

const privateOnPageChange = (current: number): void => {
  page.value = current;
  void privateLoad();
};

const privateSelect = (item: IamSelectOption): void => {
  if (item.available === false || boundLoading.value) return;
  if (props.showPrimary && props.multiple && selectedCount.value === 0 && !props.restricted)
    primaryId.value = item.id;
  if (!boundMode.value) {
    draft.value = props.multiple ? [...draft.value, item] : [item];
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
  if (primaryId.value === id)
    primaryId.value = rightItems.value.find(
      (item) => item.id !== id && item.available !== false && !item.labelPending,
    )?.id;
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
    for (const item of selectableItems.value) {
      privateDeselect(item.id);
    }
    return;
  }
  for (const item of selectableItems.value) {
    if (!selectedIds.value.has(item.id)) {
      privateSelect(item);
    }
  }
};

const privateRemove = (id: string): void => {
  privateDeselect(id);
};

const privateClear = (): void => {
  const retainedPrimary =
    boundMode.value &&
    partial.value &&
    !boundItems.value.some((item) => item.id === primaryId.value)
      ? primaryId.value
      : undefined;
  primaryId.value = retainedPrimary;
  if (!boundMode.value) {
    draft.value = props.organization ? draft.value.filter((item) => item.labelPending) : [];
    return;
  }
  added.value = [];
  removedIds.value = new Set([
    ...removedIds.value,
    ...(partial.value ? boundItems.value.map((item) => item.id) : boundIdSet.value),
  ]);
};

const privateLoadMoreCandidates = (): void => {
  if (!canLoadMoreCandidates.value || loading.value || loadingMore.value || moreFailed.value)
    return;
  void privateLoad(true);
};
const privateLoadMoreBound = (): void => {
  if (!canLoadMoreBound.value || boundLoading.value || boundLoadFailed.value) return;
  void privateLoadBound(false);
};
const privateScrollCandidates = (event: Event): void => {
  if (!props.organization || loading.value) return;
  const container = event.currentTarget as HTMLElement;
  const more = container.querySelector('[data-picker-more="departments"]');
  const viewport = container.getBoundingClientRect();
  const bounds = more?.getBoundingClientRect();
  if (
    navigation.hasMore.value &&
    !navigation.loading.value &&
    !navigation.failed.value &&
    bounds &&
    bounds.top <= viewport.bottom + ORGANIZATION_PICKER_SCROLL_THRESHOLD &&
    bounds.bottom >= viewport.top
  ) {
    void navigation.load(true);
    return;
  }
  if (
    container.scrollHeight - container.scrollTop - container.clientHeight <=
    ORGANIZATION_PICKER_SCROLL_THRESHOLD
  )
    privateLoadMoreCandidates();
};
const privateScrollSelected = (event: Event): void => {
  if (!props.organization) return;
  const container = event.currentTarget as HTMLElement;
  if (
    container.scrollHeight - container.scrollTop - container.clientHeight <=
    ORGANIZATION_PICKER_SCROLL_THRESHOLD
  )
    privateLoadMoreBound();
};

const privateCancel = (): void => {
  visible.value = false;
};

const privateConfirm = (): void => {
  if (!boundMode.value) {
    emits("confirm", [...draft.value], primaryId.value, { added: [], removedIds: [] });
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
    nextIds.map(
      (id) =>
        named.get(id) ?? { id, name: props.organization ? "信息受限" : id, labelPending: true },
    ),
    primaryId.value,
    { added: [...added.value], removedIds: [...removedIds.value] },
    {
      records: boundItems.value.map((item) => ({ ...item })),
      total: boundTotal.value,
      current: boundPage.value,
      size: boundPageSize.value,
    },
  );
  visible.value = false;
};

defineExpose({
  show(current: MemberPickerShowInput = [], initialPage?: Page<IamSelectOption>, primary?: string) {
    if (searchTimer) clearTimeout(searchTimer);
    primaryId.value = primary ?? props.primaryMemberId;
    partial.value = !Array.isArray(current) && !!current.partial;
    navigation.reset();
    if (props.organization && !props.loadBrowse) void navigation.load();
    epoch += 1;
    request += 1;
    pending.clear();
    completed.clear();
    browsePending.clear();
    browseCompleted.clear();
    navigationRequest++;
    if (initialPage)
      completed.set(JSON.stringify({ current: 1, size: pageSize, query: undefined }), initialPage);
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
    boundPage.value = 0;
    boundPageSize.value = IAM_DEFAULT_PAGE_SIZE;
    boundTotal.value = 0;
    boundExhausted.value = false;
    candidateExhausted.value = false;
    loadingMore.value = false;
    moreFailed.value = false;
    removedIds.value = new Set();
    visible.value = true;
    if (isBoundInput(current)) {
      boundMode.value = true;
      boundIdSet.value = new Set([
        ...current.boundIds,
        ...(current.boundItems || []).map((item) => item.id),
      ]);
      boundItems.value = mergeOrganizationItems(
        current.initialBoundPage?.records || [],
        current.boundItems || [],
      );
      boundIdSet.value = new Set([...boundIdSet.value, ...boundItems.value.map((item) => item.id)]);
      if (current.initialBoundPage) {
        boundPage.value = current.initialBoundPage.current || 1;
        boundPageSize.value = current.initialBoundPage.size || IAM_DEFAULT_PAGE_SIZE;
        boundTotal.value = current.initialBoundPage.total || 0;
        boundExhausted.value = !current.initialBoundPage.records?.length;
      } else if (!props.loadBound) {
        boundTotal.value = boundIdSet.value.size;
        boundExhausted.value = true;
      }
      added.value = [...(current.added || [])];
      removedIds.value = new Set(current.removedIds || []);
      void privateLoad();
      if (!current.initialBoundPage && props.loadBound) void privateLoadBound(true);
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
watch([() => props.resetKey, ...(navigation.scopeKey ? [navigation.scopeKey] : [])], () => {
  visible.value = false;
});
watch(visible, (value) => {
  if (!value) {
    if (searchTimer) clearTimeout(searchTimer);
    epoch += 1;
    request += 1;
    pending.clear();
    completed.clear();
    browsePending.clear();
    browseCompleted.clear();
    navigationRequest++;
    loading.value = false;
    loadingMore.value = false;
    boundLoading.value = false;
    emits("closed");
  }
});
onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer);
  epoch += 1;
  request += 1;
  pending.clear();
  completed.clear();
  browsePending.clear();
  browseCompleted.clear();
  navigationRequest++;
});
</script>

<style src="./organization-member-picker.css"></style>
