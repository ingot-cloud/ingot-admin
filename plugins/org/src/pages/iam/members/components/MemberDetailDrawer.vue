<template>
  <in-detail-drawer
    v-model="visible"
    v-model:tab="tab"
    v-model:editing="editing"
    title="成员详情"
    :loading="loading"
    :saving="session.saving.value"
    @edit="privateEnterEdit"
    @cancel="privateCancel"
    @save="privateSave"
  >
    <in-biz-tab-panel title="基本资料" name="base" :editable="canEditProfile">
      <in-form v-if="detail" :editing="editing">
        <in-detail-field
          v-if="isFieldVisible(detail.fieldAccess, 'displayName')"
          label="显示名"
          :value="detail.record.displayName || detail.record.id"
        >
          <el-input
            v-model="draft.displayName"
            :disabled="!isFieldEditable(detail.fieldAccess, 'displayName')"
            placeholder="请输入显示名"
            @update:model-value="dirty.add('displayName')"
            clearable
          />
        </in-detail-field>
        <in-detail-field
          v-if="isFieldVisible(detail.fieldAccess, 'phone')"
          label="手机号"
          :value="detail.record.phone"
        >
          <el-input
            v-model="draft.phone"
            :disabled="!isFieldEditable(detail.fieldAccess, 'phone')"
            placeholder="请输入手机号"
            @update:model-value="dirty.add('phone')"
            clearable
          />
        </in-detail-field>
        <in-detail-field
          v-if="isFieldVisible(detail.fieldAccess, 'email')"
          label="邮箱"
          :value="detail.record.email"
        >
          <el-input
            v-model="draft.email"
            :disabled="!isFieldEditable(detail.fieldAccess, 'email')"
            placeholder="请输入邮箱"
            @update:model-value="dirty.add('email')"
            clearable
          />
        </in-detail-field>
        <in-detail-field label="状态" :value="detail.record.status" />
      </in-form>
    </in-biz-tab-panel>
    <in-biz-tab-panel title="任职部门" name="departments" :editable="canEditDepartments">
      <in-form :editing="editing">
        <in-detail-field label="部门" :value="departmentIds">
          <biz-iam-chip-page-select
            v-model="departmentIds"
            :load-data="loadDepartments"
            placeholder="远程分页添加部门"
            empty-text="未指定部门"
          />
        </in-detail-field>
      </in-form>
    </in-biz-tab-panel>
  </in-detail-drawer>
</template>

<script setup lang="ts">
import { Message, createLoadGuard, useDetailEditSession } from "@ingot/admin-core";
import {
  BizIamChipPageSelect,
  createIamListLoader,
  fieldTextDraft,
  fieldTextPatch,
  isFieldVisible,
  isFieldEditable,
  IamAction,
  toIamSelectRecords,
  type MemberRecord,
  type ResourceDetail,
} from "@ingot/admin-common";
import {
  TenantDepartmentPageAPI,
  TenantMemberDepartmentsAPI,
  TenantMemberDetailAPI,
  TenantMemberUpdateAPI,
} from "@/api/iam/directory";
import { tenantMemberQueryKeys } from "@/api/iam/directory.query";
import { useQueryClient } from "@tanstack/vue-query";
import type { Row } from "../table";

defineOptions({ name: "MemberDetailDrawer" });

const emits = defineEmits<{ success: [] }>();
const queryClient = useQueryClient();
const session = useDetailEditSession();
const { editing } = session;
const visible = ref(false);
const tab = ref("base");
const loading = ref(false);
const detail = ref<ResourceDetail<MemberRecord>>();
const departmentIds = ref<string[]>([]);
const draft = reactive({
  displayName: "",
  phone: "",
  email: "",
});
const loadGuard = createLoadGuard();
const bindings = { displayName: "displayName", phone: "phone", email: "email" } as const;
type ProfileKey = keyof typeof bindings;
const dirty = reactive(new Set<ProfileKey>());
const canEditProfile = computed(
  () =>
    detail.value?.capabilities[IamAction.TENANT_MEMBER_UPDATE]?.allowed === true &&
    Object.values(bindings).some((key) => isFieldEditable(detail.value?.fieldAccess, key)),
);
const canEditDepartments = computed(
  () => detail.value?.capabilities[IamAction.TENANT_MEMBER_DEPARTMENTS]?.allowed === true,
);
const privateEnterEdit = (): void => {
  if (tab.value === "base" ? canEditProfile.value : canEditDepartments.value) session.enterEdit();
};

const loadDepartments = createIamListLoader(async (page, condition) => {
  const response = await TenantDepartmentPageAPI(page, condition);
  return { data: toIamSelectRecords(response.data) };
});

const applyDraft = (record: MemberRecord): void => {
  dirty.clear();
  const safe = fieldTextDraft(record, bindings, detail.value?.fieldAccess ?? {});
  draft.displayName = safe.displayName ?? "";
  draft.phone = safe.phone ?? "";
  draft.email = safe.email ?? "";
  departmentIds.value = record.departments.map((item) => item.id);
};

const load = (id: string): void => {
  const guard = loadGuard.begin();
  loading.value = true;
  detail.value = undefined;
  departmentIds.value = [];
  draft.displayName = "";
  draft.phone = "";
  draft.email = "";
  TenantMemberDetailAPI(id)
    .then((response) => {
      if (!guard.isCurrent()) {
        return;
      }
      detail.value = response.data;
      applyDraft(response.data.record);
    })
    .finally(() => {
      if (guard.isCurrent()) {
        loading.value = false;
      }
    });
};

const privateCancel = (): void => {
  session.exitEdit();
  if (detail.value) {
    applyDraft(detail.value.record);
  }
};

const privateSave = (): void => {
  if (!detail.value) {
    return;
  }
  if (tab.value === "departments") {
    privateSaveDepartments();
    return;
  }
  if (!canEditProfile.value) return;
  const access = detail.value.fieldAccess;
  const initial = fieldTextDraft(detail.value.record, bindings, access);
  const patch = fieldTextPatch(
    { displayName: draft.displayName.trim(), phone: draft.phone.trim(), email: draft.email.trim() },
    initial,
    bindings,
    access,
    dirty,
    new Set<ProfileKey>(["phone", "email"]),
  );
  if (patch.displayName !== undefined && !patch.displayName) {
    Message.warning("请输入显示名");
    return;
  }
  if (!Object.keys(patch).length) {
    session.exitEdit();
    return;
  }
  session.saving.value = true;
  TenantMemberUpdateAPI(detail.value.record.id, {
    expectedVersion: detail.value.version,
    ...patch,
  })
    .then((response) => {
      detail.value = response.data;
      applyDraft(response.data.record);
      Message.success("保存成功");
      session.exitEdit();
      void queryClient.invalidateQueries({ queryKey: tenantMemberQueryKeys.lists() });
      emits("success");
    })
    .finally(() => {
      session.saving.value = false;
    });
};

const privateSaveDepartments = (): void => {
  if (!detail.value || !canEditDepartments.value) {
    return;
  }
  session.saving.value = true;
  TenantMemberDepartmentsAPI(detail.value.record.id, {
    expectedVersion: detail.value.version,
    departments: departmentIds.value.map((id, index) => ({ id, primary: index === 0 })),
  })
    .then((response) => {
      detail.value = response.data;
      applyDraft(response.data.record);
      Message.success("任职已更新");
      session.exitEdit();
      void queryClient.invalidateQueries({ queryKey: tenantMemberQueryKeys.lists() });
      emits("success");
    })
    .finally(() => {
      session.saving.value = false;
    });
};

defineExpose({
  show(row: Row) {
    visible.value = true;
    tab.value = "base";
    session.exitEdit();
    load(row.record.id);
  },
});
</script>
