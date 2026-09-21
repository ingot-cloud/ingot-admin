<template>
  <in-drawer v-model="visible" title="添加组织成员" :loading="loading" size="520px">
    <el-form label-position="top">
      <el-form-item v-if="canLookup" label="登录名">
        <div class="flex gap-8px">
          <el-input v-model="username" clearable placeholder="精确查找已有全局账号" />
          <in-button @click="privateLookup">查找</in-button>
        </div>
      </el-form-item>
      <el-form-item label="账号 ID" required>
        <el-input v-model="accountId" clearable placeholder="查找结果或粘贴账号 ID" />
      </el-form-item>
      <el-form-item label="显示名">
        <el-input v-model="displayName" clearable />
      </el-form-item>
      <el-form-item label="任职部门">
        <biz-iam-chip-page-select
          v-model="departmentIds"
          :load-data="loadDepartments"
          placeholder="远程分页添加部门"
          empty-text="未指定部门"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <in-button @click="visible = false">取消</in-button>
      <in-button type="primary" :loading="loading" :disabled="!accountId.trim()" @in-click="privateSubmit">
        添加
      </in-button>
    </template>
  </in-drawer>
</template>

<script setup lang="ts">
import { Message, useCapabilities } from "@ingot/admin-core";
import {
  AccountLookupPurpose,
  BizIamChipPageSelect,
  IamAction,
  createIamListLoader,
  toIamSelectRecords,
} from "@ingot/admin-common";
import { TenantAccountLookupAPI, TenantDepartmentPageAPI, TenantMemberCreateAPI } from "@/api/iam/directory";
import { tenantMemberQueryKeys } from "@/api/iam/directory.query";
import { useQueryClient } from "@tanstack/vue-query";

defineOptions({ name: "MemberCreateDrawer" });

const emits = defineEmits<{ success: [] }>();
const queryClient = useQueryClient();
const { hasAction } = useCapabilities();
const visible = ref(false);
const loading = ref(false);
const username = ref("");
const accountId = ref("");
const displayName = ref("");
const departmentIds = ref<string[]>([]);
const canLookup = computed(() => hasAction(IamAction.PLATFORM_ACCOUNT_LOOKUP));

const loadDepartments = createIamListLoader(async (page, condition) => {
  const response = await TenantDepartmentPageAPI(page, condition);
  return { data: toIamSelectRecords(response.data) };
});

const privateLookup = (): void => {
  if (!username.value.trim()) {
    Message.warning("请输入登录名");
    return;
  }
  loading.value = true;
  TenantAccountLookupAPI({
    purpose: AccountLookupPurpose.MEMBER_CREATE,
    username: username.value.trim(),
  })
    .then((response) => {
      accountId.value = response.data.record.id;
      Message.success("已定位账号，不展示组织关系");
    })
    .finally(() => {
      loading.value = false;
    });
};

const privateSubmit = (): void => {
  if (!accountId.value.trim()) {
    Message.warning("请填写账号 ID");
    return;
  }
  loading.value = true;
  TenantMemberCreateAPI({
    accountId: accountId.value.trim(),
    displayName: displayName.value.trim() || undefined,
    departments: departmentIds.value.map((id, index) => ({ id, primary: index === 0 })),
  })
    .then(() => {
      Message.success("已添加组织成员");
      void queryClient.invalidateQueries({ queryKey: tenantMemberQueryKeys.lists() });
      visible.value = false;
      emits("success");
    })
    .finally(() => {
      loading.value = false;
    });
};

defineExpose({
  show() {
    username.value = "";
    accountId.value = "";
    displayName.value = "";
    departmentIds.value = [];
    visible.value = true;
  },
});
</script>
