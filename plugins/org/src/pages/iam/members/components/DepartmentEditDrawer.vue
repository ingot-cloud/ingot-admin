<template>
  <in-drawer v-model="visible" :title="edit ? '编辑部门' : '新增部门'" :loading="loading" size="480px">
    <el-form label-position="top">
      <el-form-item label="名称" required>
        <el-input v-model="draft.name" clearable />
      </el-form-item>
      <el-form-item label="上级部门">
        <in-page-select
          v-model="draft.parentId"
          filterable
          remote
          clearable
          value-field="id"
          label-field="name"
          placeholder="空表示根部门"
          :load-data="loadDepartments"
        />
      </el-form-item>
      <el-form-item label="排序">
        <el-input-number v-model="draft.sortOrder" :min="0" />
      </el-form-item>
    </el-form>
    <template #footer>
      <in-button @click="visible = false">取消</in-button>
      <in-button type="primary" :loading="loading" @in-click="privateSubmit">保存</in-button>
    </template>
  </in-drawer>
</template>

<script setup lang="ts">
import { Message } from "@ingot/admin-core";
import { createIamListLoader, toIamSelectRecords, type DepartmentRecord, type ResourceDetail } from "@ingot/admin-common";
import {
  TenantDepartmentCreateAPI,
  TenantDepartmentDetailAPI,
  TenantDepartmentPageAPI,
  TenantDepartmentUpdateAPI,
} from "@/api/iam/directory";

defineOptions({ name: "DepartmentEditDrawer" });

const emits = defineEmits<{ success: [] }>();
const visible = ref(false);
const loading = ref(false);
const edit = ref(false);
const parentId = ref<string>();
const detail = ref<ResourceDetail<DepartmentRecord>>();
const draft = reactive({
  name: "",
  parentId: "",
  sortOrder: 0,
});

const loadDepartments = createIamListLoader(async (page, condition) => {
  const response = await TenantDepartmentPageAPI(page, condition);
  return { data: toIamSelectRecords(response.data) };
});

const privateSubmit = (): void => {
  if (!draft.name.trim()) {
    Message.warning("请填写部门名称");
    return;
  }
  loading.value = true;
  const task = edit.value && detail.value
    ? TenantDepartmentUpdateAPI(detail.value.record.id, {
        expectedVersion: detail.value.version,
        department: {
          parentId: draft.parentId || undefined,
          name: draft.name.trim(),
          sortOrder: draft.sortOrder,
        },
      })
    : TenantDepartmentCreateAPI({
        parentId: draft.parentId || parentId.value,
        name: draft.name.trim(),
        sortOrder: draft.sortOrder,
      });
  task
    .then(() => {
      Message.success(edit.value ? "部门已更新" : "部门已创建");
      visible.value = false;
      emits("success");
    })
    .finally(() => {
      loading.value = false;
    });
};

defineExpose({
  show(options?: { id?: string; parentId?: string }) {
    edit.value = Boolean(options?.id);
    parentId.value = options?.parentId;
    draft.name = "";
    draft.parentId = options?.parentId ?? "";
    draft.sortOrder = 0;
    detail.value = undefined;
    visible.value = true;
    if (!options?.id) {
      return;
    }
    loading.value = true;
    TenantDepartmentDetailAPI(options.id)
      .then((response) => {
        detail.value = response.data;
        draft.name = response.data.record.name;
        draft.parentId = response.data.record.parentId ?? "";
        draft.sortOrder = response.data.record.sortOrder;
      })
      .finally(() => {
        loading.value = false;
      });
  },
});
</script>
