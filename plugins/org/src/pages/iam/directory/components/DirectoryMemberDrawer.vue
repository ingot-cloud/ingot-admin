<template>
  <in-drawer v-model="visible" title="通讯录详情" :loading="loading" size="480px">
    <el-form v-if="detail" label-position="top">
      <el-form-item label="显示名">
        <span>{{ detail.record.displayName || detail.record.id }}</span>
      </el-form-item>
      <el-form-item label="手机号">
        <span>{{ detail.record.phone || "—" }}</span>
      </el-form-item>
      <el-form-item label="邮箱">
        <span>{{ detail.record.email || "—" }}</span>
      </el-form-item>
      <el-form-item label="状态">
        <span>{{ detail.record.status }}</span>
      </el-form-item>
    </el-form>
  </in-drawer>
</template>

<script setup lang="ts">
import type { MemberRecord, ResourceDetail } from "@ingot/admin-common";
import { DirectoryMemberDetailAPI } from "@/api/iam/directory";
import type { Row } from "../table";

defineOptions({ name: "DirectoryMemberDrawer" });

const visible = ref(false);
const loading = ref(false);
const detail = ref<ResourceDetail<MemberRecord>>();

defineExpose({
  show(row: Row) {
    visible.value = true;
    loading.value = true;
    DirectoryMemberDetailAPI(row.record.id)
      .then((response) => {
        detail.value = response.data;
      })
      .finally(() => {
        loading.value = false;
      });
  },
});
</script>
