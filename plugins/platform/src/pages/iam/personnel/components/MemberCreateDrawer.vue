<template>
  <in-drawer v-model="visible" title="添加平台成员" :loading="loading" size="520px">
    <in-form v-if="step === 1" label-position="top">
      <el-form-item label="登录名" required>
        <div class="flex gap-8px">
          <el-input v-model="username" clearable placeholder="精确查找已有全局账号" />
          <in-button :disabled="!fieldsReady || loading" @click="privateLookup">查找</in-button>
        </div>
      </el-form-item>
      <template v-if="accountId">
        <el-form-item v-if="memberFieldVisible(createFields, 'avatar')" label="头像">
          <in-common-upload-avatar
            v-if="isFieldEditable(createFields, 'avatar')"
            dir="user/avatar"
            v-model="avatar"
          />
          <span v-else>不可修改</span>
        </el-form-item>
        <el-form-item v-if="memberFieldVisible(createFields, 'displayName')" label="显示名">
          <el-input
            v-if="isFieldEditable(createFields, 'displayName')"
            v-model="displayName"
            clearable
            placeholder="请输入显示名"
          />
          <span v-else>由系统设置默认显示名</span>
        </el-form-item>
        <el-form-item label="登录名">
          <el-input :model-value="lookedUpUsername" disabled placeholder="不可修改" />
        </el-form-item>
        <el-form-item v-if="memberFieldVisible(createFields, 'phone')" label="初始联系手机号">
          <el-input :model-value="phone || '-'" disabled placeholder="不可修改" />
        </el-form-item>
        <el-form-item v-if="memberFieldVisible(createFields, 'email')" label="初始联系邮箱">
          <el-input :model-value="email || '-'" disabled placeholder="不可修改" />
        </el-form-item>
        <div class="text-12px text-[var(--el-text-color-secondary)]">
          创建时从账号复制初始联系方式，之后可在成员详情独立修改，不影响账号登录信息。
        </div>
      </template>
    </in-form>
    <in-form v-else label-position="top">
      <el-form-item v-if="canGrantDirect" label="角色">
        <member-roles-field v-model:draft="roleState" editing editable :can-add="canGrantDirect" />
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
import { Confirm, Message, createLoadGuard, isApiError } from "@ingot/admin-core";
import {
  AccountLookupPurpose,
  AuthorizationDomain,
  BizIamMemberPickerDialog,
  BizIamOptionTagField,
  isFieldEditable,
  type FieldAccessMap,
  type IamSelectOption,
} from "@ingot/admin-common";
import { PlatformAccountLookupAPI } from "@/api/iam/accounts";
import { PlatformMemberCreateAPI, PlatformMemberContextAPI } from "@/api/iam/personnel";
import { platformMemberQueryKeys } from "@/api/iam/personnel.query";
import { useQueryClient } from "@tanstack/vue-query";
import { loadPlatformGroupOptions } from "../iamMemberOptions";
import { useDirectRoleEligibility } from "../useDirectRoleEligibility";
import MemberRolesField from "./MemberRolesField.vue";
import { memberRoleChanges, type MemberRoleEditorState } from "../memberRoleEditor";
import { memberCreateProfile, memberFieldVisible } from "../memberFieldAccess";

defineOptions({ name: "MemberCreateDrawer" });

const { canGrantDirect, refresh: refreshEligibility } = useDirectRoleEligibility();
const OBJECT_NOT_FOUND = "ObjectNotFound";
const ACCOUNTS_ROUTE = "platform.iam.accounts";

const emits = defineEmits<{ success: [] }>();
const queryClient = useQueryClient();
const go = useGo();
const visible = ref(false);
const loading = ref(false);
const createFields = ref<FieldAccessMap>({});
const fieldsReady = ref(false);
const loadGuard = createLoadGuard();
const step = ref<1 | 2>(1);
const username = ref("");
const accountId = ref("");
const lookedUpUsername = ref("");
const phone = ref("");
const email = ref("");
const displayName = ref("");
const avatar = ref<string | undefined>();
const roleState = ref<MemberRoleEditorState>();
const groups = ref<IamSelectOption[]>([]);
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
  roleState.value = undefined;
  groups.value = [];
  step.value = 1;
};

const privateLookup = (): void => {
  if (!fieldsReady.value || loading.value) return;
  const guard = loadGuard.begin();
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
      if (!guard.isCurrent() || !visible.value) return;
      createFields.value = response.data.fieldAccess;
      const record = response.data.record;
      accountId.value = record.id;
      lookedUpUsername.value = record.username;
      phone.value = record.phone ?? "";
      email.value = record.email ?? "";
      displayName.value = isFieldEditable(createFields.value, "displayName") ? record.username : "";
      Message.success("已定位账号，不展示组织关系");
    })
    .catch((error: unknown) => {
      if (!guard.isCurrent() || !visible.value) return;
      if (isApiError(error) && error.code === OBJECT_NOT_FOUND) {
        Confirm.warning("未找到该登录名，是否前往创建全局账号？").then(() => {
          visible.value = false;
          go({ name: ACCOUNTS_ROUTE, query: { username: loginName } });
        });
      }
    })
    .finally(() => {
      if (guard.isCurrent()) loading.value = false;
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
  roleState.value = undefined;
  groups.value = [];
  privateSubmit();
};

const privatePickGroups = (): void => {
  groupPickerRef.value?.show(groups.value);
};

const privateOnGroupsConfirm = (selected: IamSelectOption[]): void => {
  groups.value = selected;
};

const privateSubmit = (): void => {
  if (!accountId.value || !fieldsReady.value || loading.value) {
    Message.warning("请先查找账号");
    return;
  }
  loading.value = true;
  PlatformMemberCreateAPI({
    accountId: accountId.value,
    ...memberCreateProfile(createFields.value, displayName.value, avatar.value),
    departments: [],
    roleIds: [],
    roleAssignments:
      canGrantDirect.value && roleState.value ? memberRoleChanges(roleState.value).additions : [],
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

watch(visible, (value) => {
  if (!value) loadGuard.begin();
});

defineExpose({
  show() {
    void refreshEligibility();
    resetDraft();
    createFields.value = {};
    fieldsReady.value = false;
    visible.value = true;
    const guard = loadGuard.begin();
    loading.value = true;
    PlatformMemberContextAPI()
      .then((response) => {
        if (!guard.isCurrent() || !visible.value) return;
        createFields.value = response.data.createFieldAccess;
        fieldsReady.value = true;
      })
      .catch(() => undefined)
      .finally(() => {
        if (guard.isCurrent()) loading.value = false;
      });
  },
});
</script>
