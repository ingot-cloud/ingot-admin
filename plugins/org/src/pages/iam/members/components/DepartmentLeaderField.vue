<template>
  <div class="w-full flex flex-col gap-8px">
    <span v-if="!canRead">负责人信息受限</span>
    <template v-else>
      <in-loading :loading="loading">
        <biz-tenant-member-select
          v-if="editing"
          v-model="selectedIds"
          multiple
          show-primary
          :disabled="loading || failed || disabled"
          :options="known"
          :selected-total="selectedTotal"
          :load-members="loadCandidates"
          :load-browse="loadBrowse"
          :load-bound="loadBound"
          :relation="relation"
          :primary-member-id="primaryId"
          :restricted="restricted"
          :reset-key="departmentId"
          title="请选择"
          placeholder="请选择部门负责人"
          @confirm="privateConfirm"
        />
        <BizIamMemberChips
          v-else
          tagged
          wrap
          :members="selectedMembers"
          :total="selectedTotal"
          :primary-member-id="primaryId"
          :empty-text="restricted ? '负责人信息受限' : '-'"
        />
      </in-loading>
      <span v-if="restricted" class="text-12px text-[var(--el-text-color-secondary)]"
        >部分关系不可见，保存将保留未展示的负责人。</span
      >
      <in-button v-if="failed" link @in-click="load">负责人加载失败，重试</in-button>
    </template>
  </div>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import {
  BizTenantMemberSelect,
  BizIamMemberChips,
  OrganizationMemberScene,
  useOrganizationMemberScopeKey,
  type OrganizationMemberBrowseLoader,
  type DepartmentLeaderRecord,
  type DepartmentLeaderPage,
  type DepartmentLeaderUpdateInput,
  type IamSelectOption,
  type MemberPickerChanges,
  type OrganizationMemberParams,
} from "@ingot/admin-common";
import { useCapabilities, type Page } from "@ingot/admin-core";
import {
  TenantOrganizationMemberBrowseAPI,
  TenantDepartmentLeadersAPI,
  TenantDepartmentLeaderCandidatesAPI,
} from "@/api/iam/directory";
const props = defineProps<{
  departmentId: string;
  initialPage?: DepartmentLeaderPage;
  editing: boolean;
  canRead: boolean;
  disabled?: boolean;
}>();
const emits = defineEmits<{
  change: [changes?: Omit<DepartmentLeaderUpdateInput, "expectedVersion">];
}>();
const scopeKey = useOrganizationMemberScopeKey(useCapabilities());
const boundSnapshot = ref<Page<IamSelectOption>>();
const loading = ref(false),
  failed = ref(false),
  restricted = ref(false);
const known = ref<IamSelectOption[]>([]),
  selectedIds = ref<string[]>([]),
  baseIds = ref<string[]>([]);
const added = ref<IamSelectOption[]>([]),
  removedIds = ref<string[]>([]);
const primaryId = ref<string>(),
  originalPrimaryId = ref<string>();
const total = ref(0);
const selectedTotal = computed(() =>
  Math.max(0, total.value - removedIds.value.length + added.value.length),
);
let sequence = 0;
const option = (item: DepartmentLeaderRecord): IamSelectOption => ({
  id: item.memberId,
  name: item.displayName || "姓名受限",
  avatar: item.avatar,
  available: item.available,
  summary: item.departments?.map((department) => department.name).join("、"),
});
const relation = computed(() => ({
  boundIds: baseIds.value,
  boundItems: known.value.filter((item) => !added.value.some((added) => added.id === item.id)),
  added: added.value,
  removedIds: removedIds.value,
  partial: true,
  initialBoundPage: boundSnapshot.value,
}));
const selectedMembers = computed(() =>
  selectedIds.value
    .map((id) => known.value.find((item) => item.id === id) || { id, name: "姓名受限" })
    .sort(
      (left, right) => Number(right.id === primaryId.value) - Number(left.id === primaryId.value),
    ),
);
const applyPage = (data: DepartmentLeaderPage) => {
  total.value = Number(data.total);
  known.value = data.items.map(option);
  boundSnapshot.value = {
    records: [...known.value],
    total: total.value,
    current: data.page,
    size: data.pageSize,
  };
  baseIds.value = known.value.map((item) => item.id);
  selectedIds.value = [...baseIds.value];
  primaryId.value =
    data.primaryLeader?.memberId || data.items.find((item) => item.primary)?.memberId;
  originalPrimaryId.value = primaryId.value;
  restricted.value = data.restricted;
  added.value = [];
  removedIds.value = [];
  emits("change");
};
const load = async () => {
  if (!props.canRead) return;
  const current = ++sequence;
  loading.value = true;
  failed.value = false;
  try {
    const response = await TenantDepartmentLeadersAPI(props.departmentId, 1);
    if (current !== sequence) return;
    applyPage(response.data);
  } catch {
    if (current === sequence) failed.value = true;
  } finally {
    if (current === sequence) loading.value = false;
  }
};
const loadBrowse: OrganizationMemberBrowseLoader = async (params) =>
  (
    await TenantOrganizationMemberBrowseAPI({
      ...params,
      scene: OrganizationMemberScene.DEPARTMENT_LEADER,
      targetDepartmentId: props.departmentId,
    })
  ).data;
const loadCandidates = async (params: OrganizationMemberParams): Promise<Page<IamSelectOption>> => {
  const response = await TenantDepartmentLeaderCandidatesAPI(
    props.departmentId,
    params.current || 1,
    params.query,
    undefined,
    params.departmentId,
  );
  return {
    current: response.data.page,
    size: response.data.pageSize,
    total: Number(response.data.total),
    records: response.data.items.map(option),
  };
};
const loadBound = async (params: OrganizationMemberParams): Promise<Page<IamSelectOption>> => {
  const response = await TenantDepartmentLeadersAPI(props.departmentId, params.current || 1);
  return {
    current: response.data.page,
    size: response.data.pageSize,
    total: Number(response.data.total),
    records: response.data.items.map(option),
  };
};
const privateConfirm = (
  items: IamSelectOption[],
  primary?: string,
  changes?: MemberPickerChanges,
  snapshot?: Page<IamSelectOption>,
) => {
  if (snapshot) {
    boundSnapshot.value = snapshot;
    total.value = Number(snapshot.total);
    baseIds.value = snapshot.records?.map((item) => item.id) || [];
  }
  known.value = items;
  primaryId.value = primary;
  added.value = changes?.added || [];
  removedIds.value = changes?.removedIds || [];
  const dirty =
    added.value.length || removedIds.value.length || primary !== originalPrimaryId.value;
  emits(
    "change",
    dirty
      ? {
          addMemberIds: added.value.map((item) => item.id),
          removeMemberIds: removedIds.value,
          ...(primary !== originalPrimaryId.value && primary ? { primaryMemberId: primary } : {}),
        }
      : undefined,
  );
};
watch(
  () => [props.departmentId, props.canRead, scopeKey.value, props.initialPage],
  (value, before) => {
    sequence++;
    loading.value = false;
    known.value = [];
    boundSnapshot.value = undefined;
    baseIds.value = [];
    selectedIds.value = [];
    total.value = 0;
    primaryId.value = undefined;
    originalPrimaryId.value = undefined;
    restricted.value = false;
    added.value = [];
    removedIds.value = [];
    emits("change");
    if (!props.canRead) return;
    const sameContext = !before || (value[0] === before[0] && value[2] === before[2]);
    if (props.initialPage && sameContext) applyPage(props.initialPage);
    else void load();
  },
  { immediate: true },
);
watch(
  () => props.editing,
  (editing, before) => {
    if (!editing && before) {
      if (props.initialPage) applyPage(props.initialPage);
      else void load();
    }
  },
);
onBeforeUnmount(() => {
  sequence++;
});
</script>
