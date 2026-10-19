<template>
  <in-detail-drawer
    v-model="visible"
    v-model:editing="editing"
    title="部门详情"
    edit-label="编辑"
    :tabs="false"
    :editable="canEdit || canManageLeaders"
    :loading="loading"
    :saving="saving"
    @edit="privateEnterEdit"
    @cancel="privateCancel"
    @save="privateSave"
  >
    <template #identity>
      <in-detail-identity :name="detail?.record.name || ''" :editable="false">
        <template #avatar><department-mark :size="56" /></template>
        <template #more>
          <el-dropdown
            trigger="click"
            placement="bottom-end"
            popper-class="in-dropdown"
            @command="privateOnMoreCommand"
          >
            <in-button link type="primary">更多操作</in-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="delete" :disabled="!canDelete">删除</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </in-detail-identity>
    </template>

    <el-alert
      v-if="conflict"
      class="mb-12px"
      type="warning"
      :closable="false"
      title="部门配置已变化，草稿已保留。请取消编辑并重新加载后核对。"
    />
    <in-form v-if="detail" :editing="editing">
      <in-detail-field label="部门名称" :value="detail.record.name">
        <template v-if="canEdit" #default
          ><el-input v-model="draft.name" clearable placeholder="请输入部门名称"
        /></template>
      </in-detail-field>
      <in-detail-field label="上级部门" :value="parentLabel">
        <template v-if="canEdit" #default
          ><member-department-field
            v-model="parentSelection"
            :multiple="false"
            :disabled="saving"
            :exclude-department-id="detail.record.id"
            placeholder="请选择上级部门"
            @update:model-value="draft.parentId = $event[0]?.id || ''"
        /></template>
      </in-detail-field>
      <in-detail-field label="排序" :value="detail.record.sortOrder">
        <template v-if="canEdit" #default
          ><el-input-number v-model="draft.sortOrder" :min="0" placeholder="请输入排序"
        /></template>
      </in-detail-field>
      <el-form-item label="部门负责人">
        <DepartmentLeaderField
          :key="`${detail.record.id}:${detail.version}`"
          :department-id="detail.record.id"
          :initial-page="detail.record.leaderPage"
          :editing="editing && canManageLeaders"
          :can-read="canReadMembers && !!detail.record.leaderPage"
          :disabled="saving"
          @change="leaderChanges = $event"
        />
      </el-form-item>
    </in-form>
  </in-detail-drawer>
</template>

<script setup lang="ts">
import { Confirm, Message, useDetailEditSession, useCapabilities } from "@ingot/admin-core";
import {
  IamAction,
  objectActionAllowed,
  type MemberDepartmentView,
  type DepartmentRecord,
  type ResourceDetail,
} from "@ingot/admin-common";
import {
  TenantDepartmentDeleteAPI,
  TenantDepartmentDetailAPI,
  TenantDepartmentEditAPI,
} from "@/api/iam/directory";

import DepartmentLeaderField from "./DepartmentLeaderField.vue";
import DepartmentMark from "./DepartmentMark.vue";
import MemberDepartmentField from "./MemberDepartmentField.vue";

defineOptions({ name: "DeptDetailDrawer" });

const emits = defineEmits<{ success: [] }>();
const session = useDetailEditSession();
const { editing } = session;
const visible = ref(false);
const { hasAction, contextEpoch, version, unavailable, actionCodes } = useCapabilities();
const canReadMembers = computed(() => hasAction(IamAction.TENANT_MEMBER_READ));
const leaderChanges =
  ref<Omit<import("@ingot/admin-common").DepartmentLeaderUpdateInput, "expectedVersion">>();
const conflict = ref(false);
let request = 0;
const loading = ref(false);
const saving = computed(() => session.saving.value);
const detail = ref<ResourceDetail<DepartmentRecord>>();
const parentSelection = ref<MemberDepartmentView[]>([]);
const parentLabel = computed(() =>
  detail.value?.record.parentId
    ? detail.value.record.parentDepartment?.name || "上级部门信息受限"
    : "-",
);
const draft = reactive({
  name: "",
  parentId: "",
  sortOrder: 0,
});

const canEdit = computed(
  () =>
    !detail.value?.record.navigationOnly &&
    objectActionAllowed(detail.value?.capabilities, IamAction.TENANT_DEPARTMENT_UPDATE).allowed,
);
const canManageLeaders = computed(
  () =>
    canReadMembers.value &&
    !detail.value?.record.navigationOnly &&
    objectActionAllowed(detail.value?.capabilities, IamAction.TENANT_DEPARTMENT_LEADERS).allowed,
);

const canDelete = computed(
  () =>
    !detail.value?.record.navigationOnly &&
    objectActionAllowed(detail.value?.capabilities, IamAction.TENANT_DEPARTMENT_DELETE).allowed,
);

const applyDraft = (record: DepartmentRecord): void => {
  draft.name = record.name;
  draft.parentId = record.parentId ?? "";
  draft.sortOrder = record.sortOrder;
  parentSelection.value = record.parentId
    ? [
        {
          id: record.parentId,
          name: record.parentDepartment?.name || "上级部门信息受限",
          primary: true,
        },
      ]
    : [];
};

const load = (id: string): void => {
  const current = ++request;
  loading.value = true;
  detail.value = undefined;
  leaderChanges.value = undefined;
  conflict.value = false;
  TenantDepartmentDetailAPI(id)
    .then((response) => {
      if (current !== request) return;
      detail.value = response.data;
      applyDraft(response.data.record);
    })
    .finally(() => {
      if (current === request) loading.value = false;
    });
};

const privateEnterEdit = (): void => {
  if (canEdit.value || canManageLeaders.value) {
    session.enterEdit();
  }
};

const privateCancel = (): void => {
  session.exitEdit();
  if (detail.value) load(detail.value.record.id);
};

const privateSave = async (): Promise<void> => {
  if (!detail.value || saving.value || conflict.value) return;
  const record = detail.value.record;
  const basicChanged =
    canEdit.value &&
    (draft.name !== record.name ||
      (draft.parentId || undefined) !== record.parentId ||
      draft.sortOrder !== record.sortOrder);
  if (basicChanged && !draft.name.trim()) {
    Message.warning("请填写部门名称");
    return;
  }
  if (!basicChanged && !leaderChanges.value) {
    session.exitEdit();
    return;
  }
  const current = request;
  session.saving.value = true;
  try {
    const response = await TenantDepartmentEditAPI(record.id, {
      expectedVersion: detail.value.version,
      ...(basicChanged
        ? {
            department: {
              parentId: draft.parentId || undefined,
              name: draft.name.trim(),
              sortOrder: draft.sortOrder,
            },
          }
        : {}),
      ...(canManageLeaders.value && leaderChanges.value ? { leaders: leaderChanges.value } : {}),
    });
    if (current !== request) return;
    detail.value = response.data;
    applyDraft(response.data.record);
    leaderChanges.value = undefined;
    session.exitEdit();
    Message.success("部门已保存");
    emits("success");
  } catch (error) {
    if (
      current === request &&
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "RevisionConflict"
    )
      conflict.value = true;
  } finally {
    if (current === request) session.saving.value = false;
  }
};

const privateDelete = (): void => {
  if (!detail.value || !canDelete.value) {
    return;
  }
  Confirm.error(`只能删除空部门。是否删除（${detail.value.record.name}）？`, {
    confirmButtonText: "删除",
  }).then(() => {
    TenantDepartmentDeleteAPI(detail.value!.record.id).then(() => {
      Message.success("已删除");
      visible.value = false;
      emits("success");
    });
  });
};

const privateOnMoreCommand = (command: string): void => {
  if (command === "delete") {
    privateDelete();
  }
};

watch(
  () => JSON.stringify([contextEpoch.value, version.value, unavailable.value, actionCodes.value]),
  () => {
    request++;
    visible.value = false;
    detail.value = undefined;
    leaderChanges.value = undefined;
    session.exitEdit();
    session.saving.value = false;
  },
);
onBeforeUnmount(() => {
  request++;
});

defineExpose({
  show(row: { id: string }) {
    visible.value = true;
    session.exitEdit();
    load(row.id);
  },
});
</script>
