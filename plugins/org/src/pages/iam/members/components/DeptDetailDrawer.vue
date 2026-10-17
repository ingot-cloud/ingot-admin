<template>
  <in-detail-drawer
    v-model="visible"
    v-model:tab="tab"
    v-model:editing="editing"
    title="部门详情"
    edit-label="编辑基本信息"
    :loading="loading"
    :saving="saving"
    @edit="privateEnterEdit"
    @cancel="privateCancel"
    @save="privateSave"
  >
    <template #identity>
      <in-detail-identity :name="detail?.record.name || ''" :show-avatar="false" :editable="false">
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

    <in-biz-tab-panel title="基本信息" name="basic" :editable="canEdit">
      <in-form v-if="detail" :editing="editing">
        <in-detail-field label="部门名称" :value="detail.record.name">
          <el-input v-model="draft.name" clearable placeholder="请输入部门名称" />
        </in-detail-field>
        <in-detail-field label="上级部门" :value="detail.record.parentId || '-'">
          <in-page-select
            v-model="draft.parentId"
            filterable
            remote
            clearable
            value-field="id"
            label-field="name"
            placeholder="请选择上级部门"
            :load-data="loadDepartments"
          />
        </in-detail-field>
        <in-detail-field label="排序" :value="detail.record.sortOrder">
          <el-input-number v-model="draft.sortOrder" :min="0" placeholder="请输入排序" />
        </in-detail-field>
      </in-form>
    </in-biz-tab-panel>
  </in-detail-drawer>
</template>

<script setup lang="ts">
import { Confirm, Message, useDetailEditSession } from "@ingot/admin-core";
import {
  createIamListLoader,
  IamAction,
  objectActionAllowed,
  toIamSelectRecords,
  type DepartmentRecord,
  type ResourceDetail,
} from "@ingot/admin-common";
import {
  TenantDepartmentDeleteAPI,
  TenantDepartmentDetailAPI,
  TenantDepartmentPageAPI,
  TenantDepartmentUpdateAPI,
} from "@/api/iam/directory";

defineOptions({ name: "DeptDetailDrawer" });

const emits = defineEmits<{ success: [] }>();
const session = useDetailEditSession();
const { editing } = session;
const visible = ref(false);
const tab = ref("basic");
const loading = ref(false);
const saving = computed(() => session.saving.value);
const detail = ref<ResourceDetail<DepartmentRecord>>();
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
const canDelete = computed(
  () =>
    !detail.value?.record.navigationOnly &&
    objectActionAllowed(detail.value?.capabilities, IamAction.TENANT_DEPARTMENT_DELETE).allowed,
);

const loadDepartments = createIamListLoader(async (page, condition) => {
  const response = await TenantDepartmentPageAPI(page, condition);
  return { data: toIamSelectRecords(response.data) };
});

const applyDraft = (record: DepartmentRecord): void => {
  draft.name = record.name;
  draft.parentId = record.parentId ?? "";
  draft.sortOrder = record.sortOrder;
};

const load = (id: string): void => {
  loading.value = true;
  detail.value = undefined;
  TenantDepartmentDetailAPI(id)
    .then((response) => {
      detail.value = response.data;
      applyDraft(response.data.record);
    })
    .finally(() => {
      loading.value = false;
    });
};

const privateEnterEdit = (): void => {
  if (canEdit.value) {
    session.enterEdit();
  }
};

const privateCancel = (): void => {
  session.exitEdit();
  if (detail.value) {
    applyDraft(detail.value.record);
  }
};

const privateSave = (): void => {
  if (!detail.value || !canEdit.value) {
    return;
  }
  if (!draft.name.trim()) {
    Message.warning("请填写部门名称");
    return;
  }
  session.saving.value = true;
  TenantDepartmentUpdateAPI(detail.value.record.id, {
    expectedVersion: detail.value.version,
    department: {
      parentId: draft.parentId || undefined,
      name: draft.name.trim(),
      sortOrder: draft.sortOrder,
    },
  })
    .then((response) => {
      detail.value = response.data;
      applyDraft(response.data.record);
      Message.success("部门已更新");
      session.exitEdit();
      emits("success");
    })
    .finally(() => {
      session.saving.value = false;
    });
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

defineExpose({
  show(row: { id: string }) {
    visible.value = true;
    tab.value = "basic";
    session.exitEdit();
    load(row.id);
  },
});
</script>
