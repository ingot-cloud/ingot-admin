<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header description="组织设置。所有者转交使用独立命令，不与资料保存混为一步。" />
    </template>
    <in-split-layout>
      <el-form v-if="detail" label-position="top" class="max-w-480px p-16px">
        <el-form-item label="组织名称">
          <el-input v-model="draft.name" />
        </el-form-item>
        <el-form-item>
          <in-button type="primary" :loading="saving" @click="privateSave">保存设置</in-button>
        </el-form-item>
        <el-form-item label="新所有者成员 ID">
          <el-input v-model="newOwnerMemberId" placeholder="当前组织内有效成员" />
        </el-form-item>
        <el-form-item>
          <in-button @click="privateTransfer">转交所有者</in-button>
        </el-form-item>
      </el-form>
    </in-split-layout>
  </in-page-frame>
</template>

<script lang="ts" setup>
import { Message } from "@ingot/admin-core";
import { TenantOwnerTransferAPI, TenantSettingsAPI, TenantSettingsUpdateAPI } from "@/api/iam/directory";

const detail = ref<{ version: string; record: { name: string } }>();
const draft = reactive({ name: "" });
const newOwnerMemberId = ref("");
const saving = ref(false);

const load = (): void => {
  TenantSettingsAPI().then((response) => {
    detail.value = {
      version: response.data.version,
      record: { name: response.data.record.name },
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
      detail.value = { version: response.data.version, record: { name: response.data.record.name } };
      Message.success("保存成功");
    })
    .finally(() => {
      saving.value = false;
    });
};

const privateTransfer = (): void => {
  if (!detail.value || !newOwnerMemberId.value) {
    Message.warning("请输入新所有者");
    return;
  }
  TenantOwnerTransferAPI({
    expectedVersion: detail.value.version,
    newOwnerMemberId: newOwnerMemberId.value,
  }).then(() => {
    Message.success("已提交转交");
    load();
  });
};

onMounted(load);
</script>
