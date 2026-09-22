<template>
  <in-detail-drawer
    v-model="visible"
    v-model:tab="tab"
    v-model:editing="editing"
    title="成员详情"
    :loading="loading"
    :saving="session.saving.value"
    @edit="session.enterEdit"
    @cancel="privateCancel"
    @save="privateSave"
  >
    <in-biz-tab-panel title="基本资料" name="base">
      <in-form v-if="detail" :editing="editing">
        <in-detail-field
          label="显示名"
          :value="detail.record.displayName || detail.record.id"
        >
          <el-input v-model="draft.displayName" placeholder="请输入显示名" />
        </in-detail-field>
        <in-detail-field label="手机号" :value="detail.record.phone">
          <el-input v-model="draft.phone" placeholder="请输入手机号" />
        </in-detail-field>
        <in-detail-field label="邮箱" :value="detail.record.email">
          <el-input v-model="draft.email" placeholder="请输入邮箱" />
        </in-detail-field>
        <in-detail-field label="状态" :value="detail.record.status" />
      </in-form>
    </in-biz-tab-panel>
    <in-biz-tab-panel title="任职部门" name="departments">
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
  editablePatch,
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

const loadDepartments = createIamListLoader(async (page, condition) => {
  const response = await TenantDepartmentPageAPI(page, condition);
  return { data: toIamSelectRecords(response.data) };
});

const applyDraft = (record: MemberRecord): void => {
  draft.displayName = record.displayName ?? "";
  draft.phone = record.phone ?? "";
  draft.email = record.email ?? "";
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
  const access = detail.value.fieldAccess;
  const next = {
    displayName: draft.displayName.trim() || undefined,
    phone: draft.phone.trim() || undefined,
    email: draft.email.trim() || undefined,
  };
  const patch = Object.keys(access).length
    ? editablePatch(next, access, ["displayName", "phone", "email"])
    : next;
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
  if (!detail.value) {
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
