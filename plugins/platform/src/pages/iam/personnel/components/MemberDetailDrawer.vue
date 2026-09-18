<template>
  <in-detail-drawer
    v-model="visible"
    v-model:tab="tab"
    v-model:editing="session.editing.value"
    title="成员详情"
    :loading="loading"
    :saving="session.saving.value"
    @edit="session.enterEdit"
    @cancel="privateCancel"
    @save="privateSave"
  >
    <in-biz-tab-panel title="基本资料" name="base">
      <el-form v-if="detail" label-position="top">
        <el-form-item label="显示名">
          <el-input v-if="session.editing.value" v-model="draft.displayName" />
          <span v-else>{{ detail.record.displayName || detail.record.id }}</span>
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-if="session.editing.value" v-model="draft.phone" />
          <span v-else>{{ detail.record.phone || "—" }}</span>
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-if="session.editing.value" v-model="draft.email" />
          <span v-else>{{ detail.record.email || "—" }}</span>
        </el-form-item>
        <el-form-item label="状态">
          <span>{{ detail.record.status }}</span>
        </el-form-item>
      </el-form>
    </in-biz-tab-panel>
  </in-detail-drawer>
</template>

<script setup lang="ts">
import { Message, useDetailEditSession } from "@ingot/admin-core";
import {
  editablePatch,
  type MemberRecord,
  type ResourceDetail,
} from "@ingot/admin-common";
import { PlatformMemberDetailAPI, PlatformMemberUpdateAPI } from "@/api/iam/personnel";
import { platformMemberQueryKeys } from "@/api/iam/personnel.query";
import { useQueryClient } from "@tanstack/vue-query";
import type { Row } from "../table";

defineOptions({ name: "MemberDetailDrawer" });

const emits = defineEmits<{ success: [] }>();
const queryClient = useQueryClient();
const session = useDetailEditSession();
const visible = ref(false);
const tab = ref("base");
const loading = ref(false);
const detail = ref<ResourceDetail<MemberRecord>>();
const draft = reactive({
  displayName: "",
  phone: "",
  email: "",
});

const applyDraft = (record: MemberRecord): void => {
  draft.displayName = record.displayName ?? "";
  draft.phone = record.phone ?? "";
  draft.email = record.email ?? "";
};

const load = (id: string): void => {
  loading.value = true;
  PlatformMemberDetailAPI(id)
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
    displayName: draft.displayName.trim() || undefined,
    phone: draft.phone.trim() || undefined,
    email: draft.email.trim() || undefined,
  };
  const patch = Object.keys(access).length
    ? editablePatch(next, access, ["displayName", "phone", "email"])
    : next;
  session.saving.value = true;
  PlatformMemberUpdateAPI(detail.value.record.id, {
    expectedVersion: detail.value.version,
    ...patch,
  })
    .then((response) => {
      detail.value = response.data;
      applyDraft(response.data.record);
      Message.success("保存成功");
      session.exitEdit();
      void queryClient.invalidateQueries({ queryKey: platformMemberQueryKeys.lists() });
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
