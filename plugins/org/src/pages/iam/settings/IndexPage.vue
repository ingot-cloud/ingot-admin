<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header description="组织设置。所有者转交使用独立命令，不与资料保存混为一步。" />
    </template>
    <in-split-layout>
      <el-form v-if="detail" label-position="top" class="max-w-480px p-16px">
        <el-form-item label="组织名称">
          <el-input v-model="draft.name" placeholder="请输入组织名称" />
        </el-form-item>
        <el-form-item label="当前所有者">
          <span>{{ detail.record.ownerDisplayName || detail.record.ownerMemberId }}</span>
        </el-form-item>
        <el-form-item>
          <in-button type="primary" :loading="saving" @click="privateSave">保存设置</in-button>
        </el-form-item>
        <el-form-item label="新所有者">
          <in-page-select
            v-model="newOwnerMemberId"
            filterable
            remote
            clearable
            value-field="id"
            label-field="name"
            placeholder="选择当前组织内有效成员"
            :load-data="loadMembers"
          />
        </el-form-item>
        <el-form-item>
          <in-button type="danger" :loading="transferring" :disabled="transferring" @click="privateTransfer">
            转交所有者
          </in-button>
        </el-form-item>
      </el-form>
    </in-split-layout>
  </in-page-frame>
</template>

<script lang="ts" setup>
import {
  Confirm,
  Message,
  refreshSessionPermissions,
} from "@ingot/admin-core";
import { createIamListLoader, toIamSelectRecords, type TenantRecord } from "@ingot/admin-common";
import {
  TenantMemberPageAPI,
  TenantOwnerTransferAPI,
  TenantSettingsAPI,
  TenantSettingsUpdateAPI,
} from "@/api/iam/directory";

const detail = ref<{ version: string; record: TenantRecord }>();
const draft = reactive({ name: "" });
const newOwnerMemberId = ref("");
const saving = ref(false);
const transferring = ref(false);

const loadMembers = createIamListLoader(async (page, condition) => {
  const response = await TenantMemberPageAPI(page, condition);
  return { data: toIamSelectRecords(response.data) };
});

const load = (): void => {
  TenantSettingsAPI().then((response) => {
    detail.value = {
      version: response.data.version,
      record: response.data.record,
    };
    draft.name = response.data.record.name;
  });
};

const privateSave = (): void => {
  if (!detail.value) {
    return;
  }
  saving.value = true;
  TenantSettingsUpdateAPI({
    expectedVersion: detail.value.version,
    name: draft.name,
  })
    .then((response) => {
      detail.value = { version: response.data.version, record: response.data.record };
      Message.success("保存成功");
    })
    .finally(() => {
      saving.value = false;
    });
};

const privateTransfer = (): void => {
  if (!detail.value || !newOwnerMemberId.value) {
    Message.warning("请选择新所有者");
    return;
  }
  if (transferring.value) {
    return;
  }
  Confirm.warning("转交后当前所有者将失去组织所有权。是否继续？", { confirmButtonText: "转交" }).then(() => {
    transferring.value = true;
    TenantOwnerTransferAPI({
      expectedVersion: detail.value?.version ?? "",
      newOwnerMemberId: newOwnerMemberId.value,
    })
      .then(() => {
        Message.success("已转交所有者");
        newOwnerMemberId.value = "";
        load();
        void refreshSessionPermissions({ refreshMenusIfVersionChanged: true });
      })
      .finally(() => {
        transferring.value = false;
      });
  });
};

onMounted(load);
</script>
