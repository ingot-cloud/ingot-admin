<template>
  <in-drawer v-model="visible" title="锁定账号" :loading="loading" size="480px">
    <in-form v-if="row" label-position="top">
      <el-form-item label="账号">
        <span>{{ row.record.username }}</span>
      </el-form-item>
      <el-form-item label="锁定原因">
        <el-input v-model="reasonDetail" type="textarea" :rows="3" placeholder="交给安全用例处理" />
      </el-form-item>
      <el-form-item label="到期时间">
        <el-date-picker
          v-model="lockedUntil"
          type="datetime"
          value-format="YYYY-MM-DDTHH:mm:ss.SSSZ"
          placeholder="为空表示永久锁定"
        />
      </el-form-item>
    </in-form>
    <template #footer>
      <in-button @click="visible = false">取消</in-button>
      <in-button type="primary" :loading="loading" @in-click="privateSubmit">锁定</in-button>
    </template>
  </in-drawer>
</template>

<script setup lang="ts">
import { Message } from "@ingot/admin-core";
import { PlatformAccountLockAPI } from "@/api/iam/accounts";
import { platformAccountQueryKeys } from "@/api/iam/accounts.query";
import { useQueryClient } from "@tanstack/vue-query";
import type { Row } from "../table";

defineOptions({ name: "AccountLockDrawer" });

const emits = defineEmits<{ success: [] }>();
const queryClient = useQueryClient();
const visible = ref(false);
const loading = ref(false);
const row = ref<Row>();
const reasonDetail = ref("");
const lockedUntil = ref<string>();

const privateSubmit = (): void => {
  if (!row.value) {
    return;
  }
  loading.value = true;
  PlatformAccountLockAPI(row.value.record.id, {
    expectedVersion: row.value.version,
    reasonDetail: reasonDetail.value.trim() || undefined,
    lockedUntil: lockedUntil.value || undefined,
  })
    .then(() => {
      Message.success("已锁定");
      void queryClient.invalidateQueries({ queryKey: platformAccountQueryKeys.lists() });
      visible.value = false;
      emits("success");
    })
    .finally(() => {
      loading.value = false;
    });
};

defineExpose({
  show(target: Row) {
    row.value = target;
    reasonDetail.value = "";
    lockedUntil.value = undefined;
    visible.value = true;
  },
});
</script>
