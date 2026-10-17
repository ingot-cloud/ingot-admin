<template>
  <in-drawer v-model="visible" title="新建部门" :loading="loading" size="480px">
    <in-form label-position="top">
      <el-form-item label="名称" required>
        <el-input v-model="draft.name" clearable placeholder="请输入部门名称" />
      </el-form-item>
      <el-form-item label="上级部门">
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
      </el-form-item>
      <el-form-item label="排序">
        <el-input-number v-model="draft.sortOrder" :min="0" placeholder="请输入排序" />
      </el-form-item>
    </in-form>
    <template #footer>
      <in-button @click="visible = false">取消</in-button>
      <in-button type="primary" :loading="loading" @in-click="privateSubmit">保存</in-button>
    </template>
  </in-drawer>
</template>

<script setup lang="ts">
import { Message } from "@ingot/admin-core";
import { createIamListLoader, toIamSelectRecords } from "@ingot/admin-common";
import { TenantDepartmentCreateAPI, TenantDepartmentPageAPI } from "@/api/iam/directory";

defineOptions({ name: "DeptCreateDrawer" });

const emits = defineEmits<{ success: [] }>();
const visible = ref(false);
const loading = ref(false);
const parentId = ref<string>();
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
  TenantDepartmentCreateAPI({
    parentId: draft.parentId || parentId.value,
    name: draft.name.trim(),
    sortOrder: draft.sortOrder,
  })
    .then(() => {
      Message.success("部门已创建");
      visible.value = false;
      emits("success");
    })
    .finally(() => {
      loading.value = false;
    });
};

defineExpose({
  show(options?: { parentId?: string }) {
    parentId.value = options?.parentId;
    draft.name = "";
    draft.parentId = options?.parentId ?? "";
    draft.sortOrder = 0;
    visible.value = true;
  },
});
</script>
