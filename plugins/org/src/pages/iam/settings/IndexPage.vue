<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header description="组织设置。所有者转交使用独立命令，不与资料保存混为一步。" />
    </template>
    <in-split-layout>
      <in-form-content
        ><el-form
          v-if="detail"
          label-position="top"
          class="grid grid-cols-1 md:grid-cols-2 gap-x-24px"
        >
          <el-form-item label="组织名称">
            <el-input v-model="draft.name" placeholder="请输入组织名称" />
          </el-form-item>
          <el-form-item label="当前所有者">
            <span>{{ detail.record.ownerDisplayName || detail.record.ownerMemberId }}</span
            ><el-tag v-if="permissions.tenantOwner" class="ml-8px">当前组织拥有者</el-tag>
          </el-form-item>
          <el-form-item>
            <in-button type="primary" :loading="saving" @click="privateSave">保存设置</in-button>
          </el-form-item>
          <el-form-item v-if="canTransfer" label="新所有者">
            <biz-tenant-member-select
              v-model="newOwnerMemberId"
              :load-members="loadMembers"
              placeholder="选择当前组织内有效成员"
            />
          </el-form-item>
          <el-form-item v-if="canTransfer">
            <in-button
              type="danger"
              :loading="transferring"
              :disabled="transferring || !canTransfer"
              @click="privateTransfer"
            >
              转交所有者
            </in-button>
          </el-form-item>
        </el-form></in-form-content
      >
    </in-split-layout>
  </in-page-frame>
</template>

<script lang="ts" setup>
import { Confirm, Message, refreshSessionPermissions, usePermissions } from "@ingot/admin-core";
import {
  IamAction,
  objectActionAllowed,
  type ResourceDetail,
  type TenantRecord,
  BizTenantMemberSelect,
} from "@ingot/admin-common";
import {
  TenantMemberPickerLoad,
  TenantOwnerTransferAPI,
  TenantSettingsAPI,
  TenantSettingsUpdateAPI,
} from "@/api/iam/directory";

const detail = ref<ResourceDetail<TenantRecord>>();
const permissions = usePermissions();
const canTransfer = computed(
  () =>
    permissions.tenantOwner &&
    objectActionAllowed(detail.value?.capabilities || {}, IamAction.TENANT_SETTINGS_OWNER_TRANSFER)
      .allowed,
);
const draft = reactive({ name: "" });
const newOwnerMemberId = ref("");
const saving = ref(false);
const transferring = ref(false);

const loadMembers = TenantMemberPickerLoad;

const load = (): void => {
  TenantSettingsAPI().then((response) => {
    detail.value = response.data;
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
      detail.value = response.data;
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
  Confirm.warning("转交后当前所有者将失去组织所有权。是否继续？", {
    confirmButtonText: "转交",
  }).then(() => {
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
