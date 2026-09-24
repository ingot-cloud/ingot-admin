<template>
  <div>
    <div class="flex flex-col gap-16px max-w-720px">
      <in-form label-position="top">
        <el-form-item label="套餐">
          <in-page-select
            v-model="planPick"
            filterable
            remote
            clearable
            value-field="id"
            label-field="name"
            placeholder="远程分页选择套餐，可清空"
            :options="planOptions"
            :load-data="loadPlans"
          />
        </el-form-item>
        <el-form-item label="自选应用">
          <div
            class="entitlement-app-field"
            role="button"
            tabindex="0"
            @click="privateOpenPicker"
            @keydown.enter.prevent="privateOpenPicker"
          >
            <span
              class="flex-1 min-w-0 truncate"
              :class="{ 'text-[var(--el-text-color-placeholder)]': !extras.length }"
            >
              {{ extras.length ? `已选 ${extras.length} 个应用` : "请选择应用" }}
            </span>
            <in-icon name="ep:edit" class="shrink-0 text-[var(--el-text-color-secondary)]" />
          </div>
        </el-form-item>
      </in-form>
      <div class="text-12px text-[var(--el-text-color-secondary)]">
        组织默认应用必须开通，不可取消也不可停用。套餐行不可单独移除，但可对该组织停用。不填结束时间则无限使用。开通不等于业务授权。
      </div>
      <div class="rounded-4px px-16px py-16px bg-[#f8f9fa] flex flex-col gap-16px">
        <div v-if="resolving" class="text-12px text-[var(--el-text-color-secondary)]">正在解析开通并集</div>
        <div v-else-if="!items.length" class="text-12px text-[var(--el-text-color-secondary)]">暂无开通记录</div>
        <div v-for="item in items" :key="item.applicationId" class="flex flex-col gap-8px">
          <div class="flex items-center justify-between gap-12px">
            <div class="flex items-center gap-8px min-w-0">
              <el-icon class="entitlement-check"><Check /></el-icon>
              <span class="truncate">{{ item.applicationName }}</span>
              <span class="text-12px text-[var(--el-text-color-secondary)]">
                {{ sourceLabel(item.source) }}
              </span>
            </div>
            <in-button
              v-if="isRemovableEntitlement(item) && extraIds.includes(item.applicationId)"
              link
              type="primary"
              @in-click="() => privateRemove(item.applicationId)"
            >
              移除
            </in-button>
          </div>
          <div class="flex items-center gap-12px">
            <in-select
              v-model="item.status"
              class="w-120px"
              :options="statusOptions"
              placeholder="请选择开通状态"
              :disabled="!isStatusEditable(item)"
            />
            <el-date-picker
              v-model="item.validUntil"
              class="flex-1"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              placeholder="不填则无限使用"
            />
          </div>
        </div>
      </div>
    </div>
    <application-picker-dialog
      ref="pickerRef"
      :load-applications="loadApplications"
      :locked-ids="lockedIds"
      @confirm="privateOnPicked"
    />
  </div>
</template>

<script setup lang="ts">
import { Check } from "@element-plus/icons-vue";
import {
  AuthorizationDomain,
  ConfigurationStatus,
  createIamListLoader,
  EntitlementSourceExtArray,
  iamEnumLabel,
  IAM_DEFAULT_PAGE_SIZE,
  toIamSelectRecords,
  useConfigurationStatusEnum,
  type EntitlementDraft,
  type IamSelectOption,
} from "@ingot/admin-common";
import type { LoadDataParams, Page } from "@ingot/admin-core";
import { PlatformApplicationSummaryPageAPI, PlatformPlanSummaryPageAPI } from "@/api/iam/catalog";
import ApplicationPickerDialog from "./ApplicationPickerDialog.vue";
import {
  extraDraftsOf,
  extraIdsForResolve,
  extraSelectOptionsOf,
  isLockedEntitlement,
  isRemovableEntitlement,
  isStatusEditable,
  toEntitlementDrafts,
  type EntitlementItem,
} from "../wizard";

defineOptions({ name: "EntitlementDraftPanel" });

const props = defineProps<{
  resolveUnion: (input: { planId?: string; extras: EntitlementDraft[] }) => Promise<EntitlementItem[]>;
}>();

const statusEnum = useConfigurationStatusEnum();
const statusOptions = statusEnum.getOptions();
const extras = ref<IamSelectOption[]>([]);
const items = ref<EntitlementItem[]>([]);
const resolvedDrafts = ref<EntitlementDraft[]>([]);
const planId = ref("");
const planOptions = ref<IamSelectOption[]>([]);
const resolving = ref(false);
const pickerRef = ref<{ show: (current: IamSelectOption[]) => void }>();

const extraIds = computed(() => extras.value.map((item) => item.id));
const lockedIds = computed(
  () => new Set(items.value.filter((item) => isLockedEntitlement(item)).map((item) => item.applicationId)),
);

const planPick = computed({
  get: () => planId.value,
  set: (value: string) => {
    planId.value = value || "";
    void privateResolve();
  },
});

const loadPlans = createIamListLoader(async (page: { current?: number; size?: number }, condition: { name?: string }) => {
  const response = await PlatformPlanSummaryPageAPI(page, {
    ...condition,
    status: ConfigurationStatus.ENABLED,
  });
  return { data: toIamSelectRecords(response.data) };
});

const loadApplications = async (params: LoadDataParams): Promise<Page<IamSelectOption>> => {
  const response = await PlatformApplicationSummaryPageAPI(
    { current: params.current, size: params.size ?? IAM_DEFAULT_PAGE_SIZE },
    {
      name: params.query,
      domain: AuthorizationDomain.TENANT,
      status: ConfigurationStatus.ENABLED,
    },
  );
  return toIamSelectRecords(response.data);
};

const extrasForResolve = (): EntitlementDraft[] =>
  extraDraftsOf(items.value, extraIdsForResolve(items.value, extraIds.value, resolvedDrafts.value));

const sourceLabel = (source?: string): string => iamEnumLabel(EntitlementSourceExtArray, source, "手动");

const privateResolve = async (): Promise<void> => {
  resolving.value = true;
  try {
    items.value = await props.resolveUnion({
      planId: planId.value || undefined,
      extras: extrasForResolve(),
    });
    extras.value = extras.value.filter(
      (item) => !items.value.some((row) => row.applicationId === item.id && isLockedEntitlement(row)),
    );
    resolvedDrafts.value = toEntitlementDrafts(items.value);
  } finally {
    resolving.value = false;
  }
};

const privateOpenPicker = (): void => {
  pickerRef.value?.show(extras.value);
};

const privateOnPicked = (applications: IamSelectOption[]): void => {
  extras.value = applications.filter((item) => !lockedIds.value.has(item.id));
  void privateResolve();
};

const privateRemove = (applicationId: string): void => {
  extras.value = extras.value.filter((item) => item.id !== applicationId);
  void privateResolve();
};

const reset = (): void => {
  extras.value = [];
  items.value = [];
  resolvedDrafts.value = [];
  planId.value = "";
  planOptions.value = [];
};

defineExpose({
  reset,
  extrasForResolve,
  planId,
  items,
  extras,
  hasSelection: () => Boolean(planId.value || extras.value.length),
  async load(input: { planId?: string; planName?: string; extras: IamSelectOption[]; items?: EntitlementItem[] }) {
    reset();
    planId.value = input.planId || "";
    planOptions.value = input.planId
      ? [{ id: input.planId, name: input.planName || input.planId }]
      : [];
    items.value = (input.items ?? []).map((item) => ({ ...item }));
    extras.value = items.value.length
      ? extraSelectOptionsOf(items.value)
      : input.extras.map((item) => ({ ...item }));
    resolvedDrafts.value = toEntitlementDrafts(items.value);
    await privateResolve();
  },
  refresh: privateResolve,
});
</script>

<style lang="postcss" scoped>
.entitlement-app-field {
  display: flex;
  align-items: center;
  gap: 8px;
  box-sizing: border-box;
  width: 100%;
  height: var(--in-control-height);
  padding: 0 11px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  background: var(--el-fill-color-blank);
  cursor: pointer;
}

.entitlement-app-field:hover,
.entitlement-app-field:focus-visible {
  border-color: var(--el-color-primary);
}

.entitlement-app-field:focus-visible {
  outline: none;
  box-shadow: 0 0 0 1px var(--el-color-primary) inset;
}

.entitlement-check {
  color: var(--in-color-primary);
}
</style>
