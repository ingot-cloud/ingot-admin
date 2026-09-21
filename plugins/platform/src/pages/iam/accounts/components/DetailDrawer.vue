<template>
  <in-detail-drawer
    v-model="visible"
    v-model:tab="tab"
    v-model:editing="editing"
    title="账号详情"
    :loading="loading"
    :saving="session.saving.value"
    @edit="session.enterEdit"
    @cancel="privateCancel"
    @save="privateSave"
  >
    <in-biz-tab-panel title="基本资料" name="base">
      <in-form v-if="detail" :editing="editing">
        <in-detail-field label="登录名" :value="detail.record.username" />
        <in-detail-field label="手机号" :value="detail.record.phone">
          <el-input v-model="draft.phone" />
        </in-detail-field>
        <in-detail-field label="邮箱" :value="detail.record.email">
          <el-input v-model="draft.email" />
        </in-detail-field>
        <in-detail-field label="启用">
          <template #view>
            <el-tag :type="detail.record.enabled ? 'success' : 'info'" effect="plain">
              {{ detail.record.enabled ? "已启用" : "已停用" }}
            </el-tag>
          </template>
        </in-detail-field>
        <in-detail-field label="锁定">
          <template #view>
            <el-tag :type="detail.record.locked ? 'warning' : 'success'" effect="plain">
              {{ detail.record.locked ? "已锁定" : "未锁定" }}
            </el-tag>
          </template>
        </in-detail-field>
        <in-detail-field label="必须改密" :value="detail.record.mustChangePassword ? '是' : '否'" />
      </in-form>
    </in-biz-tab-panel>
  </in-detail-drawer>
</template>

<script setup lang="ts">
import { Message, createLoadGuard, useDetailEditSession } from "@ingot/admin-core";
import { editablePatch, type AccountRecord, type ResourceDetail } from "@ingot/admin-common";
import { PlatformAccountDetailAPI, PlatformAccountUpdateAPI } from "@/api/iam/accounts";
import { platformAccountQueryKeys } from "@/api/iam/accounts.query";
import { useQueryClient } from "@tanstack/vue-query";
import type { Row } from "../table";

defineOptions({ name: "AccountDetailDrawer" });

const emits = defineEmits<{ success: [] }>();
const queryClient = useQueryClient();
const session = useDetailEditSession();
const { editing } = session;
const visible = ref(false);
const tab = ref("base");
const loading = ref(false);
const detail = ref<ResourceDetail<AccountRecord>>();
const draft = reactive({
  phone: "",
  email: "",
});
const loadGuard = createLoadGuard();

const applyDraft = (record: AccountRecord): void => {
  draft.phone = record.phone ?? "";
  draft.email = record.email ?? "";
};

const load = (id: string): void => {
  const guard = loadGuard.begin();
  loading.value = true;
  detail.value = undefined;
  draft.phone = "";
  draft.email = "";
  PlatformAccountDetailAPI(id)
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
