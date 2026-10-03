<template>
  <in-drawer v-model="visible" title="添加平台成员" :loading="loading" size="520px">
    <in-form v-if="step === 1" label-position="top">
      <el-form-item label="登录名" required>
        <div class="flex gap-8px">
          <el-input v-model="username" clearable placeholder="精确查找已有全局账号" />
          <in-button @click="privateLookup">查找</in-button>
        </div>
      </el-form-item>
      <template v-if="accountId">
        <el-form-item label="头像">
          <in-common-upload-avatar dir="user/avatar" v-model="avatar" />
        </el-form-item>
        <el-form-item label="显示名">
          <el-input v-model="displayName" clearable placeholder="请输入显示名" />
        </el-form-item>
        <el-form-item label="登录名">
          <el-input :model-value="lookedUpUsername" disabled placeholder="不可修改" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input :model-value="phone || '-'" disabled placeholder="不可修改" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input :model-value="email || '-'" disabled placeholder="不可修改" />
        </el-form-item>
      </template>
    </in-form>
    <in-form v-else label-position="top">
      <el-form-item v-if="canGrantDirect" label="角色">
        <div class="flex flex-col gap-8px w-full">
          <div v-for="role in roleDrafts" :key="role.roleId" class="flex items-center gap-8px">
            <span class="flex-1">{{ role.name }} · v{{ role.revisionNumber }}</span>
            <in-button text type="danger" @in-click="privateRemoveRole(role.roleId)">移除</in-button>
          </div>
          <in-button @in-click="rolePickerRef?.show()">添加角色</in-button>
        </div>
      </el-form-item>
      <el-form-item label="用户组">
        <biz-iam-option-tag-field
          v-model="groups"
          placeholder="请选择用户组"
          @pick="privatePickGroups"
        />
      </el-form-item>
    </in-form>
    <template #footer>
      <template v-if="step === 1">
        <in-button @click="visible = false">取消</in-button>
        <in-button :loading="loading" :disabled="!accountId" @in-click="privateSkip">
          跳过并添加
        </in-button>
        <in-button type="primary" :disabled="!accountId" @in-click="privateNext">下一步</in-button>
      </template>
      <template v-else>
        <in-button @in-click="privateBack">上一步</in-button>
        <in-button type="primary" :loading="loading" @in-click="privateSubmit">添加</in-button>
      </template>
    </template>
  </in-drawer>
  <member-role-assign-dialog
    ref="rolePickerRef"
    :selected-role-ids="roleDrafts.map((item) => item.roleId)"
    @confirm="privateOnRoleConfirm"
  />
  <biz-iam-member-picker-dialog
    ref="groupPickerRef"
    title="选择用户组"
    search-placeholder="请输入用户组名称"
    empty-text="暂无用户组"
    selected-unit="个用户组"
    :show-avatar="false"
    :load-members="loadPlatformGroupOptions"
    @confirm="privateOnGroupsConfirm"
  />
</template>

<script setup lang="ts">
import { Confirm, Message, isApiError } from "@ingot/admin-core";
import {
  AccountLookupPurpose,
  AuthorizationDomain,
  BizIamMemberPickerDialog,
  BizIamOptionTagField,
  type IamSelectOption,
  type MemberRoleAssignmentDraft,
} from "@ingot/admin-common";
import { PlatformAccountLookupAPI } from "@/api/iam/accounts";
import { PlatformMemberCreateAPI } from "@/api/iam/personnel";
import { platformMemberQueryKeys } from "@/api/iam/personnel.query";
import { useQueryClient } from "@tanstack/vue-query";
import { loadPlatformGroupOptions } from "../iamMemberOptions";
import { useDirectRoleEligibility } from "../useDirectRoleEligibility";
import MemberRoleAssignDialog from "./MemberRoleAssignDialog.vue";

defineOptions({ name: "MemberCreateDrawer" });

const { canGrantDirect, refresh: refreshEligibility } = useDirectRoleEligibility();
const OBJECT_NOT_FOUND = "ObjectNotFound";
const ACCOUNTS_ROUTE = "platform.iam.accounts";

const emits = defineEmits<{ success: [] }>();
const queryClient = useQueryClient();
const go = useGo();
const visible = ref(false);
const loading = ref(false);
const step = ref<1 | 2>(1);
const username = ref("");
const accountId = ref("");
const lookedUpUsername = ref("");
const phone = ref("");
const email = ref("");
const displayName = ref("");
const avatar = ref<string | undefined>();
type ConfiguredRole = MemberRoleAssignmentDraft & { name: string; revisionNumber: number };
const roleDrafts = ref<ConfiguredRole[]>([]);
const groups = ref<IamSelectOption[]>([]);
const rolePickerRef = ref<{ show: () => void }>();
const groupPickerRef = ref<{ show: (current: IamSelectOption[]) => void }>();

const resetHit = (): void => {
  accountId.value = "";
  lookedUpUsername.value = "";
  phone.value = "";
  email.value = "";
  displayName.value = "";
  avatar.value = undefined;
};

const resetDraft = (): void => {
  username.value = "";
  resetHit();
  roleDrafts.value = [];
  groups.value = [];
  step.value = 1;
};

const privateLookup = (): void => {
  const loginName = username.value.trim();
  if (!loginName) {
    Message.warning("请输入登录名");
    return;
  }
  loading.value = true;
  resetHit();
  PlatformAccountLookupAPI({
    purpose: AccountLookupPurpose.MEMBER_CREATE,
    domain: AuthorizationDomain.PLATFORM,
    username: loginName,
  })
    .then((response) => {
      const record = response.data.record;
      accountId.value = record.id;
      lookedUpUsername.value = record.username;
      phone.value = record.phone ?? "";
      email.value = record.email ?? "";
      displayName.value = record.username;
      Message.success("已定位账号，不展示组织关系");
    })
    .catch((error: unknown) => {
      if (isApiError(error) && error.code === OBJECT_NOT_FOUND) {
        Confirm.warning("未找到该登录名，是否前往创建全局账号？").then(() => {
          visible.value = false;
          go({ name: ACCOUNTS_ROUTE, query: { username: loginName } });
        });
      }
    })
    .finally(() => {
      loading.value = false;
    });
};

const privateNext = (): void => {
  if (!accountId.value) {
    Message.warning("请先查找账号");
    return;
  }
  step.value = 2;
};

const privateBack = (): void => {
  step.value = 1;
};

const privateSkip = (): void => {
  roleDrafts.value = [];
  groups.value = [];
  privateSubmit();
};

const privateRemoveRole = (roleId: string): void => {
  roleDrafts.value = roleDrafts.value.filter((item) => item.roleId !== roleId);
};

const privatePickGroups = (): void => {
  groupPickerRef.value?.show(groups.value);
};

const privateOnRoleConfirm = (role: ConfiguredRole): void => {
  roleDrafts.value = [...roleDrafts.value.filter((item) => item.roleId !== role.roleId), role];
};

const privateOnGroupsConfirm = (selected: IamSelectOption[]): void => {
  groups.value = selected;
};

const privateSubmit = (): void => {
  if (!accountId.value) {
    Message.warning("请先查找账号");
    return;
  }
  loading.value = true;
  PlatformMemberCreateAPI({
    accountId: accountId.value,
    displayName: displayName.value.trim() || undefined,
    avatar: avatar.value,
    departments: [],
    roleIds: [],
    roleAssignments: canGrantDirect.value ? roleDrafts.value.map((role) => ({
      roleId: role.roleId,
      roleRevisionRef: role.roleRevisionRef,
      scopeBindings: role.scopeBindings,
      validFrom: role.validFrom,
      validUntil: role.validUntil,
    })) : [],
    groupIds: groups.value.map((item) => item.id),
  })
    .then(() => {
      Message.success("已添加平台成员");
      void queryClient.invalidateQueries({ queryKey: platformMemberQueryKeys.lists() });
      visible.value = false;
      emits("success");
    })
    .finally(() => {
      loading.value = false;
    });
};

defineExpose({
  show() {
    void refreshEligibility();
    resetDraft();
    visible.value = true;
  },
});
</script>
