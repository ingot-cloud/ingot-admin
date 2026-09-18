<template>
  <in-detail-drawer
    v-model="visible"
    v-model:tab="tab"
    v-model:editing="session.editing.value"
    title="账号详情"
    :loading="loading"
    :saving="session.saving.value"
    @edit="session.enterEdit"
    @cancel="privateCancel"
    @save="privateSave"
  >
    <in-biz-tab-panel title="基本资料" name="base">
      <el-form v-if="detail" label-position="top">
        <el-form-item label="登录名">
          <span>{{ detail.record.username }}</span>
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-if="session.editing.value" v-model="draft.phone" />
          <span v-else>{{ detail.record.phone || "—" }}</span>
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-if="session.editing.value" v-model="draft.email" />
          <span v-else>{{ detail.record.email || "—" }}</span>
        </el-form-item>
        <el-form-item label="启用">
          <el-tag :type="detail.record.enabled ? 'success' : 'info'" effect="plain">
            {{ detail.record.enabled ? "已启用" : "已停用" }}
          </el-tag>
        </el-form-item>
        <el-form-item label="锁定">
          <el-tag :type="detail.record.locked ? 'warning' : 'success'" effect="plain">
            {{ detail.record.locked ? "已锁定" : "未锁定" }}
          </el-tag>
        </el-form-item>
        <el-form-item label="必须改密">
          <span>{{ detail.record.mustChangePassword ? "是" : "否" }}</span>
        </el-form-item>
      </el-form>
    </in-biz-tab-panel>
  </in-detail-drawer>
</template>

<script setup lang="ts">
import { Message, useDetailEditSession } from "@ingot/admin-core";
import { editablePatch, type AccountRecord, type ResourceDetail } from "@ingot/admin-common";
import { PlatformAccountDetailAPI, PlatformAccountUpdateAPI } from "@/api/iam/accounts";
import { platformAccountQueryKeys } from "@/api/iam/accounts.query";
import { useQueryClient } from "@tanstack/vue-query";
import type { Row } from "../table";

defineOptions({ name: "AccountDetailDrawer" });

const emits = defineEmits<{ success: [] }>();
const queryClient = useQueryClient();
const session = useDetailEditSession();
const visible = ref(false);
const tab = ref("base");
const loading = ref(false);
const detail = ref<ResourceDetail<AccountRecord>>();
const draft = reactive({
  phone: "",
  email: "",
});

const applyDraft = (record: AccountRecord): void => {
  draft.phone = record.phone ?? "";
  draft.email = record.email ?? "";
};

const load = (id: string): void => {
  loading.value = true;
  PlatformAccountDetailAPI(id)
    .then((response) => {
      detail.value = response.data;
      applyDraft(response.data.record);
    })
    .finally(() => {
      loading.value = false;
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
  const access = detail.value.fieldAccess;
  const next = {
    phone: draft.phone.trim() || undefined,
    email: draft.email.trim() || undefined,
  };
  const patch = Object.keys(access).length
    ? editablePatch(next, access, ["phone", "email"])
    : next;
  session.saving.value = true;
  PlatformAccountUpdateAPI(detail.value.record.id, {
    expectedVersion: detail.value.version,
    ...patch,
  })
    .then((response) => {
      detail.value = response.data;
      applyDraft(response.data.record);
      Message.success("保存成功");
      session.exitEdit();
      void queryClient.invalidateQueries({ queryKey: platformAccountQueryKeys.lists() });
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
