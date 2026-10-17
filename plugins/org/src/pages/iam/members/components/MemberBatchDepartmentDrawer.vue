<template>
  <in-drawer v-model="visible" title="批量变更部门" :loading="loading" size="520px">
    <p class="mb-12px text-[var(--in-text-color-secondary)]">
      已选 {{ members.length }} 人，确定后用下方部门覆盖其任职，第一项为主部门。
    </p>
    <in-form label-position="top">
      <el-form-item label="任职部门" required>
        <biz-iam-chip-page-select
          v-model="departmentIds"
          :load-data="loadDepartments"
          placeholder="远程分页添加部门"
          empty-text="未指定部门"
        />
      </el-form-item>
    </in-form>
    <template #footer>
      <in-button @click="visible = false">取消</in-button>
      <in-button
        type="primary"
        :loading="loading"
        :disabled="departmentIds.length === 0"
        @in-click="privateSubmit"
      >
        确定
      </in-button>
    </template>
  </in-drawer>
</template>

<script lang="ts" setup>
import { Message } from "@ingot/admin-core";
import { BizIamChipPageSelect, createIamListLoader, toIamSelectRecords } from "@ingot/admin-common";
import { TenantDepartmentPageAPI, TenantMemberDepartmentsAPI } from "@/api/iam/directory";
import { collectActiveMembers, type Row } from "../memberTable";

defineOptions({ name: "MemberBatchDepartmentDrawer" });

const emits = defineEmits<{ success: [] }>();
const visible = ref(false);
const loading = ref(false);
const members = ref<Row[]>([]);
const departmentIds = ref<string[]>([]);

const loadDepartments = createIamListLoader(async (page, condition) => {
  const response = await TenantDepartmentPageAPI(page, condition);
  return { data: toIamSelectRecords(response.data) };
});

const privateSubmit = async (): Promise<void> => {
  const targets = collectActiveMembers(members.value);
  if (targets.length === 0 || departmentIds.value.length === 0) {
    return;
  }
  loading.value = true;
  let ok = 0;
  let fail = 0;
  const departments = departmentIds.value.map((id, index) => ({ id, primary: index === 0 }));
  for (const item of targets) {
    try {
      await TenantMemberDepartmentsAPI(item.record.id, {
        expectedVersion: item.version,
        departments,
      });
      ok += 1;
    } catch {
      fail += 1;
    }
  }
  loading.value = false;
  if (fail === 0) {
    Message.success(`已更新 ${ok} 人任职`);
    visible.value = false;
    emits("success");
    return;
  }
  Message.warning(`成功 ${ok} 人，失败 ${fail} 人`);
  if (ok > 0) {
    emits("success");
  }
};

defineExpose({
  show(rows: Row[]) {
    members.value = collectActiveMembers(rows);
    departmentIds.value = [];
    visible.value = true;
  },
});
</script>
