<template>
  <in-drawer v-model="visible" title="通讯录详情" size="480px">
    <in-form-skeleton v-if="loading" />
    <in-form v-else-if="detail" :editing="false">
      <in-detail-field
        v-if="isFieldVisible(detail.fieldAccess, 'displayName')"
        label="显示名"
        :value="detail.record.displayName || detail.record.id"
      />
      <in-detail-field
        v-if="isFieldVisible(detail.fieldAccess, 'phone')"
        label="手机号"
        :value="detail.record.phone"
      />
      <in-detail-field
        v-if="isFieldVisible(detail.fieldAccess, 'email')"
        label="邮箱"
        :value="detail.record.email"
      />
      <in-detail-field label="状态" :value="detail.record.status" />
    </in-form>
  </in-drawer>
</template>

<script setup lang="ts">
import { createLoadGuard } from "@ingot/admin-core";
import { isFieldVisible, type MemberRecord, type ResourceDetail } from "@ingot/admin-common";
import { DirectoryMemberDetailAPI } from "@/api/iam/directory";
import type { Row } from "../table";

defineOptions({ name: "DirectoryMemberDrawer" });

const visible = ref(false);
const loading = ref(false);
const detail = ref<ResourceDetail<MemberRecord>>();
const loadGuard = createLoadGuard();

defineExpose({
  show(row: Row) {
    const id = row.record.id;
    const guard = loadGuard.begin();
    visible.value = true;
    loading.value = true;
    detail.value = undefined;
    DirectoryMemberDetailAPI(id)
      .then((response) => {
        if (!guard.isCurrent()) {
          return;
        }
        detail.value = response.data;
      })
      .finally(() => {
        if (guard.isCurrent()) {
          loading.value = false;
        }
      });
  },
});
</script>
