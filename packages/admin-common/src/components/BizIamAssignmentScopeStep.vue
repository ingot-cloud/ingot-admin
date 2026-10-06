<template>
  <div ref="root" class="flex flex-col gap-16px max-w-720px">
    <div class="text-12px text-[var(--el-text-color-secondary)]">
      范围类型由固定角色版本定义；新建和调整分配均可配置具体对象，各角色独立保存。
    </div>
    <div
      class="flex flex-wrap items-center gap-12px"
      aria-live="polite"
      data-testid="scope-progress"
    >
      <span
        >需配置 {{ configurations.length }} 项，已配置 {{ configuredCount }} 项，待配置
        {{ outstanding.length }} 项</span
      >
      <in-button v-if="outstanding.length" link type="primary" @in-click="privateShowOutstanding">
        查看待配置
      </in-button>
    </div>
    <in-biz-tabs-header v-model="view" :tabs="tabs" class="[--in-biz-tabs-inline-padding:0px]" />
    <div v-show="view === ScopeView.Configuration" class="flex flex-col gap-16px">
      <div class="flex flex-wrap items-center gap-12px">
        <el-input
          v-model="keyword"
          class="flex-1 min-w-180px"
          clearable
          placeholder="搜索角色、应用、资源或操作"
        >
          <template #prefix><in-icon name="ep:search" /></template>
        </el-input>
        <el-checkbox :model-value="onlyOutstanding" @change="privateFilterOutstanding">
          仅看未配置
        </el-checkbox>
      </div>
      <div
        v-if="showProblems && outstanding.length"
        class="rounded-4px border border-solid border-[var(--in-border-color)] p-12px flex flex-col gap-8px"
      >
        <div class="flex flex-wrap items-center justify-between gap-8px">
          <span>还有 {{ outstanding.length }} 项范围需要配置，点击定位</span>
          <in-button link @in-click="showProblems = false">收起清单</in-button>
        </div>
        <in-button
          v-for="item in problemPageItems"
          :key="item.key"
          link
          type="primary"
          class="justify-start! text-left! whitespace-normal!"
          @in-click="privateLocate(item.key)"
        >
          {{ item.label }}
        </in-button>
        <el-pagination
          v-if="outstanding.length > IAM_DEFAULT_PAGE_SIZE"
          :current-page="problemPage"
          :page-size="IAM_DEFAULT_PAGE_SIZE"
          :total="outstanding.length"
          layout="prev, pager, next"
          size="small"
          class="justify-end"
          @current-change="problemPage = $event"
        />
      </div>
      <div v-for="item in pagedConfigurations" :key="item.key" :data-scope-key="item.key">
        <biz-iam-assignment-scope-card
          :item="item"
          :api="api"
          :load-selected="
            hasSelectedApi(item.role) ? selectedLoader(item.role, item.parameterKey) : undefined
          "
          :delegation-grant-id="delegationGrantId"
          :reset-key="resetKey"
          :readonly="!!(readonly || readonlyForRole?.(item.role))"
          @objects="privateSetObjects(item.roleKey, item.parameterKey, $event)"
        />
      </div>
      <div
        v-if="!configurations.length && !metadataIssues.length"
        class="text-12px text-[var(--el-text-color-secondary)]"
      >
        所选角色无需配置具体对象，可在“全部权限”中核对授权范围。
      </div>
      <div v-else-if="!configurations.length" class="text-12px text-[var(--el-color-warning)]">
        固定版本范围资料不完整，无法配置，请检查下方提示。
      </div>
      <div
        v-else-if="!filteredConfigurations.length"
        class="text-12px text-[var(--el-text-color-secondary)]"
      >
        {{ keyword.trim() ? "暂无匹配的范围配置" : "当前没有未配置项" }}
      </div>
      <el-pagination
        v-if="filteredConfigurations.length > IAM_DEFAULT_PAGE_SIZE"
        :current-page="page"
        :page-size="IAM_DEFAULT_PAGE_SIZE"
        :total="filteredConfigurations.length"
        layout="prev, pager, next"
        size="small"
        class="justify-end"
        @current-change="page = $event"
      />
    </div>
    <biz-iam-assignment-grant-list
      v-if="grantViewVisited"
      v-show="view === ScopeView.Grants"
      :roles="roles"
    />
    <el-alert
      v-for="issue in metadataIssues"
      :key="issue"
      :title="issue"
      type="warning"
      :closable="false"
    />
  </div>
</template>
<script setup lang="ts">
import {
  IAM_DEFAULT_PAGE_SIZE,
  type AuthorizationCandidatesApi,
  type IamSelectOption,
} from "../models/iam";
import {
  assignmentDraftKey,
  assignmentScopeConfigurations,
  assignmentScopeIssues,
  type PlatformAssignmentRoleDraft,
} from "../models/iam/platformAssignment";
import BizIamAssignmentScopeCard from "./BizIamAssignmentScopeCard.vue";
import BizIamAssignmentGrantList from "./BizIamAssignmentGrantList.vue";

defineOptions({ name: "BizIamAssignmentScopeStep" });
const props = defineProps<{
  api: AuthorizationCandidatesApi;
  selectedApi?: AuthorizationCandidatesApi;
  /** 成员差量编辑按分配记录回显，不能跨记录复用同名参数。 */
  selectedApiForRole?: (
    role: PlatformAssignmentRoleDraft,
  ) => AuthorizationCandidatesApi | undefined;
  delegationGrantId?: string;
  resetKey: string | number;
  readonly?: boolean;
  readonlyForRole?: (role: PlatformAssignmentRoleDraft) => boolean;
}>();
const roles = defineModel<PlatformAssignmentRoleDraft[]>("roles", { required: true });
const selectedPages = new Map<string, ReturnType<AuthorizationCandidatesApi>>();
let selectedEpoch = 0;
const ScopeView = { Configuration: "configuration", Grants: "grants" } as const;
const tabs = [
  { id: ScopeView.Configuration, title: "范围配置" },
  { id: ScopeView.Grants, title: "全部权限" },
];
const view = ref<string>(ScopeView.Configuration);
const grantViewVisited = ref(false);
const root = ref<HTMLElement>();
const keyword = ref("");
const page = ref(1);
const problemPage = ref(1);
const showProblems = ref(false);
const onlyOutstanding = ref(false);
// 显式筛选时记录集合，配置完成后保持当前卡片，不自动消失或重排。
const outstandingSnapshot = ref<string[]>([]);
const configurations = computed(() => assignmentScopeConfigurations(roles.value));
const outstanding = computed(() => configurations.value.filter((item) => !item.configured));
const configuredCount = computed(() => configurations.value.length - outstanding.value.length);
const metadataIssues = computed(() => [...new Set(assignmentScopeIssues(roles.value, false))]);
const filteredConfigurations = computed(() => {
  const search = keyword.value.trim().toLocaleLowerCase();
  return configurations.value.filter(
    (item) =>
      (!onlyOutstanding.value || outstandingSnapshot.value.includes(item.key)) &&
      item.label.toLocaleLowerCase().includes(search),
  );
});
const pagedConfigurations = computed(() =>
  filteredConfigurations.value.slice(
    (page.value - 1) * IAM_DEFAULT_PAGE_SIZE,
    page.value * IAM_DEFAULT_PAGE_SIZE,
  ),
);
const problemPageItems = computed(() =>
  outstanding.value.slice(
    (problemPage.value - 1) * IAM_DEFAULT_PAGE_SIZE,
    problemPage.value * IAM_DEFAULT_PAGE_SIZE,
  ),
);
const privateFilterOutstanding = (checked: unknown): void => {
  onlyOutstanding.value = checked === true;
  outstandingSnapshot.value = outstanding.value.map((item) => item.key);
  page.value = 1;
};
const privateLocate = async (key: string): Promise<void> => {
  view.value = ScopeView.Configuration;
  keyword.value = "";
  onlyOutstanding.value = false;
  // 先让清空搜索的页码重置完成，再切到目标页。
  await nextTick();
  const index = configurations.value.findIndex((item) => item.key === key);
  if (index < 0) return;
  page.value = Math.floor(index / IAM_DEFAULT_PAGE_SIZE) + 1;
  await nextTick();
  const card = Array.from(root.value?.querySelectorAll<HTMLElement>("[data-scope-key]") || []).find(
    (item) => item.dataset.scopeKey === key,
  );
  card?.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
  card?.querySelector<HTMLButtonElement>("button:not([disabled])")?.focus({ preventScroll: true });
};
const privateShowOutstanding = async (): Promise<void> => {
  showProblems.value = true;
  problemPage.value = 1;
  keyword.value = "";
  privateFilterOutstanding(true);
  view.value = ScopeView.Configuration;
  await nextTick();
  root.value?.scrollIntoView?.({ block: "start", behavior: "smooth" });
};
defineExpose({ showOutstanding: privateShowOutstanding });
watch(keyword, () => {
  page.value = 1;
});
watch(view, (value) => {
  if (value === ScopeView.Grants) grantViewVisited.value = true;
});
watch(
  () => configurations.value.map((item) => item.key).join(","),
  () => {
    page.value = 1;
    problemPage.value = 1;
    onlyOutstanding.value = false;
    outstandingSnapshot.value = [];
  },
);
watch(
  () => outstanding.value.length,
  () => {
    problemPage.value = Math.min(
      problemPage.value,
      Math.max(1, Math.ceil(outstanding.value.length / IAM_DEFAULT_PAGE_SIZE)),
    );
  },
);
const privateSetObjects = (key: string, parameterKey: string, options: IamSelectOption[]): void => {
  roles.value = roles.value.map((role) =>
    assignmentDraftKey(role) !== key
      ? role
      : {
          ...role,
          bindings: {
            ...role.bindings,
            [parameterKey]: {
              ...role.bindings[parameterKey],
              ids: options.map((option) => option.id),
            },
          },
          selectedObjects: {
            ...role.selectedObjects,
            [parameterKey]: options.map((option) => ({ ...option })),
          },
        },
  );
};
const setNames = (key: string, parameterKey: string, options: IamSelectOption[]): void => {
  roles.value = roles.value.map((role) =>
    assignmentDraftKey(role) !== key
      ? role
      : {
          ...role,
          selectedObjects: {
            ...role.selectedObjects,
            [parameterKey]: options.map((option) => ({ ...option })),
          },
        },
  );
};
const hasSelectedApi = (role: PlatformAssignmentRoleDraft): boolean =>
  !!(props.selectedApiForRole?.(role) || props.selectedApi);
const selectedLoader =
  (role: PlatformAssignmentRoleDraft, parameterKey: string): AuthorizationCandidatesApi =>
  (query) => {
    const key = `${props.resetKey}:${assignmentDraftKey(role)}:${parameterKey}:${query.page || 1}:${query.pageSize || IAM_DEFAULT_PAGE_SIZE}`;
    const previous = selectedPages.get(key);
    if (previous) return previous;
    const pending = (props.selectedApiForRole?.(role) || props.selectedApi)!({
      ...query,
      parameterKey,
    });
    selectedPages.set(key, pending);
    void pending.catch(() => {
      if (selectedPages.get(key) === pending) selectedPages.delete(key);
    });
    return pending;
  };
const loadStoredNames = async (): Promise<void> => {
  if ((!props.selectedApi && !props.selectedApiForRole) || view.value !== ScopeView.Configuration)
    return;
  const epoch = selectedEpoch;
  const visibleKeys = new Set(pagedConfigurations.value.map((item) => item.key));
  for (const role of roles.value) {
    if (!hasSelectedApi(role)) continue;
    for (const [key, binding] of Object.entries(role.bindings)) {
      if (!visibleKeys.has(JSON.stringify([assignmentDraftKey(role), key]))) continue;
      if (!binding.ids.length || role.selectedObjects[key]?.length) continue;
      if (view.value !== ScopeView.Configuration || epoch !== selectedEpoch) return;
      try {
        const response = await selectedLoader(
          role,
          key,
        )({
          kind: "OBJECT",
          page: 1,
          pageSize: IAM_DEFAULT_PAGE_SIZE,
        });
        if (epoch !== selectedEpoch) return;
        setNames(
          assignmentDraftKey(role),
          key,
          response.data.items.filter((item) => binding.ids.includes(item.id)),
        );
      } catch {
        // 名称加载失败保留真实 ID；打开选择器可重试，预览仍由服务端重验。
      }
    }
  }
};
watch(
  () => `${view.value}:${pagedConfigurations.value.map((item) => item.key).join(",")}`,
  () => void loadStoredNames(),
);
watch(
  () => props.resetKey,
  () => {
    selectedEpoch += 1;
    selectedPages.clear();
    void loadStoredNames();
  },
);
onMounted(() => void loadStoredNames());
onBeforeUnmount(() => {
  selectedEpoch += 1;
  selectedPages.clear();
});
</script>
