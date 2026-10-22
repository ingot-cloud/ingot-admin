<template>
  <in-drawer
    v-model="visible"
    title="用户组详情"
    size="var(--in-drawer-width-detail)"
    padding="0"
    :loading="loading"
  >
    <div class="group-detail">
      <div class="group-detail__section">基本信息</div>
      <in-description-list class="group-detail__fields">
        <in-description-item label="用户组名称" :value="detail?.record.name" />
        <in-description-item label="说明" :value="detail?.record.description || '-'" />
        <in-description-item label="来源" :value="sourceLabel" />
      </in-description-list>
    </div>
    <template v-if="!viewOnly" #footer>
      <div class="w-full flex items-center justify-between">
        <in-button type="danger" text link :disabled="!canDelete" @in-click="privateOnDelete">
          <template #icon>
            <in-icon name="ep:delete" />
          </template>
          删除
        </in-button>
        <in-button type="primary" :disabled="!canUpdate" @in-click="privateOnEdit">编辑</in-button>
      </div>
    </template>
  </in-drawer>
</template>

<script setup lang="ts">
import { IamAction, objectActionAllowed } from "@ingot/admin-common";
import { TenantDepartmentTreeAPI, TenantGroupDetailAPI } from "@/api/iam/directory";
import { flattenDepartmentChoices } from "../../members/departmentSelection";
import { nestRootDepartmentChildren, toMemberDeptNode } from "../../members/deptTree";
import { formatGroupSelectionSources } from "../membership";
import type { GroupRow } from "../table";

defineOptions({ name: "GroupDetailDrawer" });

withDefaults(
  defineProps<{
    viewOnly?: boolean;
  }>(),
  { viewOnly: false },
);

const emits = defineEmits<{
  edit: [row: GroupRow];
  delete: [row: GroupRow];
}>();

const visible = ref(false);
const loading = ref(false);
const detail = ref<GroupRow>();
const departmentNames = ref(new Map<string, string>());
let request = 0;

const canDelete = computed(() => {
  const current = detail.value;
  return current
    ? objectActionAllowed(current.capabilities, IamAction.TENANT_GROUP_DELETE).allowed
    : false;
});
const canUpdate = computed(() => {
  const current = detail.value;
  return current
    ? objectActionAllowed(current.capabilities, IamAction.TENANT_GROUP_UPDATE).allowed
    : false;
});
const sourceLabel = computed(() =>
  formatGroupSelectionSources(
    detail.value?.record.selection.departments,
    departmentNames.value,
    detail.value?.record.selection.members.length ?? 0,
  ),
);

const privateLoadNames = async (current: number): Promise<void> => {
  const departments = detail.value?.record.selection.departments ?? [];
  if (!departments.length) {
    return;
  }
  try {
    const response = await TenantDepartmentTreeAPI();
    if (current !== request) {
      return;
    }
    departmentNames.value = new Map(
      flattenDepartmentChoices(
        nestRootDepartmentChildren((response.data ?? []).map(toMemberDeptNode)),
      ).map((item) => [item.id, item.name]),
    );
  } catch {
    // 名称解析失败时保留「部门范围」，不回退成部门 ID。
  }
};

const show = (row: GroupRow): void => {
  const current = ++request;
  visible.value = true;
  detail.value = row;
  departmentNames.value = new Map();
  loading.value = true;
  TenantGroupDetailAPI(row.record.id)
    .then(async (response) => {
      if (current !== request) {
        return;
      }
      detail.value = response.data;
      await privateLoadNames(current);
    })
    .finally(() => {
      if (current === request) {
        loading.value = false;
      }
    });
};

const privateOnEdit = (): void => {
  if (!detail.value) {
    return;
  }
  visible.value = false;
  emits("edit", detail.value);
};
const privateOnDelete = (): void => {
  if (!detail.value) {
    return;
  }
  emits("delete", detail.value);
};

const hide = (): void => {
  request += 1;
  visible.value = false;
};

onBeforeUnmount(() => {
  request += 1;
});

defineExpose({ show, hide });
</script>

<style scoped lang="postcss">
.group-detail {
  padding: var(--in-space-4) var(--in-space-5) var(--in-space-4);
}

.group-detail__section {
  display: flex;
  align-items: center;
  gap: var(--in-space-2);
  margin-bottom: var(--in-space-4);
  color: var(--in-text-color);
  font-size: var(--in-font-size-section-title);
  font-weight: var(--in-font-weight-section-title);
  line-height: var(--in-line-height-section-title);
}

.group-detail__section::before {
  content: "";
  width: 3px;
  height: 16px;
  border-radius: 2px;
  background: var(--in-color-primary);
}

.group-detail__fields {
  padding-left: 11px;
}
</style>
