<template>
  <in-detail-drawer
    v-model="visible"
    v-model:tab="tab"
    v-model:editing="editing"
    title="成员详情"
    edit-label="编辑成员"
    :loading="loading"
    :saving="session.saving.value"
    @edit="privateEnterEdit"
    @cancel="privateCancel"
    @save="privateSave"
  >
    <template #identity>
      <in-detail-identity
        :name="identityName"
        :src="identityAvatar"
        v-model:avatar="draft.avatar"
        :show-avatar="memberFieldVisible(detail?.fieldAccess, 'avatar')"
        :editable="editing && canEditField('avatar')"
        upload-dir="user/avatar"
      >
        <template #status>
          <status-tag
            v-if="detail && memberStatusTone(detail.record.status)"
            :tone="statusToneOf(detail.record.status)"
            :label="memberStatusEnum.getTagText(detail.record.status).text"
          />
        </template>
        <template v-if="overflowActions.length" #more>
          <el-dropdown
            trigger="click"
            placement="bottom-end"
            popper-class="in-dropdown"
            @command="privateOnMoreCommand"
          >
            <in-button link type="primary">更多操作</in-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="action in overflowActions"
                  :key="action.key"
                  :command="action.key"
                  :disabled="action.disabled"
                >
                  <span :class="{ 'is-danger': action.kind === 'danger' }">{{ action.label }}</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </in-detail-identity>
    </template>

    <in-biz-tab-panel title="基本信息" name="basic" :editable="canEditMember">
      <in-form v-if="detail" :editing="editing">
        <in-detail-field
          v-if="memberFieldVisible(detail.fieldAccess, 'displayName')"
          label="显示名"
          :value="detail.record.displayName || detail.record.id"
        >
          <el-input
            v-model="draft.displayName"
            :disabled="!canEditField('displayName')"
            clearable
            :placeholder="canEditField('displayName') ? '请输入显示名' : '不可修改'"
          />
        </in-detail-field>
        <in-detail-field label="登录名" :value="detail.record.username || '-'" />
        <in-detail-field
          v-if="memberFieldVisible(detail.fieldAccess, 'phone')"
          label="联系手机号"
          :value="detail.record.phone"
        >
          <el-input
            v-model="draft.phone"
            :disabled="!canEditField('phone')"
            clearable
            :placeholder="canEditField('phone') ? '请输入联系手机号' : '不可修改'"
          />
        </in-detail-field>
        <in-detail-field
          v-if="memberFieldVisible(detail.fieldAccess, 'email')"
          label="联系邮箱"
          :value="detail.record.email"
        >
          <el-input
            v-model="draft.email"
            :disabled="!canEditField('email')"
            clearable
            :placeholder="canEditField('email') ? '请输入联系邮箱' : '不可修改'"
          />
        </in-detail-field>

        <el-form-item label="角色分配">
          <member-roles-field
            ref="rolesField"
            v-model:draft="roleState"
            :member-id="detail.record.id"
            :editing="editing"
            :editable="canEditRoles"
            :can-add="canGrantDirect"
            :can-update="canUpdateDirect"
            :can-remove="canRevokeDirect"
          />
        </el-form-item>
        <in-detail-field label="状态">
          <template #view>
            <status-tag
              v-if="memberStatusTone(detail.record.status)"
              :tone="statusToneOf(detail.record.status)"
              :label="memberStatusEnum.getTagText(detail.record.status).text"
            />
          </template>
        </in-detail-field>
        <div class="text-12px text-[var(--el-text-color-secondary)]">
          仅用于平台联系，不影响全局账号登录信息。
        </div>
      </in-form>
    </in-biz-tab-panel>
    <in-biz-tab-panel title="其他" name="other" :editable="false">
      <in-form>
        <in-detail-field label="用户组" :value="groupPreview" />
        <template v-if="detail">
          <in-detail-field label="加入平台时间" :value="formatDateTime(detail.record.joinedAt)" />
          <in-detail-field
            label="账号最后登录时间"
            :value="formatDateTime(detail.record.lastLoginAt, { fallback: '暂无登录记录' })"
          />
          <div class="text-12px text-[var(--el-text-color-secondary)]">
            包含平台及组织身份登录。
          </div>
          <in-detail-field label="成员更新时间" :value="formatDateTime(detail.record.updatedAt)" />
        </template>
      </in-form>
    </in-biz-tab-panel>
  </in-detail-drawer>
</template>

<script setup lang="ts">
import { formatDateTime } from "@ingot/shared";
import { useDirectRoleEligibility } from "../useDirectRoleEligibility";
import {
  Confirm,
  Message,
  StatusTag,
  createLoadGuard,
  isApiError,
  objectActionAllowed,
  useDetailEditSession,
} from "@ingot/admin-core";
import {
  collectIamPageRecords,
  MemberStatus,
  IamAction,
  isFieldEditable,
  memberStatusTone,
  useMemberStatusEnum,
  type MemberRecord,
  type ResourceDetail,
} from "@ingot/admin-common";
import {
  PlatformMemberDetailAPI,
  PlatformMemberGroupsAPI,
  PlatformMemberEditPreviewAPI,
  PlatformMemberRemoveAPI,
  PlatformMemberStatusAPI,
  PlatformMemberUpdateAPI,
} from "@/api/iam/personnel";
import { platformMemberQueryKeys } from "@/api/iam/personnel.query";
import { useQueryClient } from "@tanstack/vue-query";
import MemberRolesField from "./MemberRolesField.vue";
import {
  memberRoleChanges,
  hasMemberRoleChanges,
  type MemberRoleEditorState,
} from "../memberRoleEditor";
import { createRowActions, type Row } from "../table";
import {
  memberCanEditProfile,
  memberFieldVisible,
  memberProfileDraft,
  memberProfilePatch,
} from "../memberFieldAccess";

defineOptions({ name: "MemberDetailDrawer" });

const {
  canGrantDirect,
  canReadDirect,
  canUpdateDirect,
  canRevokeDirect,
  refresh: refreshEligibility,
} = useDirectRoleEligibility();
const EMPTY_PREVIEW = "-";

const emits = defineEmits<{ success: [] }>();
const queryClient = useQueryClient();
const session = useDetailEditSession();
const { editing } = session;
const visible = ref(false);
const tab = ref("basic");
const loading = ref(false);
const detail = ref<ResourceDetail<MemberRecord>>();
const memberStatusEnum = useMemberStatusEnum();
const statusToneOf = (status: string): "info" | "warning" | "danger" =>
  memberStatusTone(status) ?? "info";
const draft = reactive({
  displayName: "",
  phone: "",
  email: "",
  avatar: undefined as string | undefined,
  status: null as MemberStatus | null,
});
const roleState = ref<MemberRoleEditorState>();
const rolesField = ref<InstanceType<typeof MemberRolesField>>();
const groupNames = ref<string[]>([]);
const groupsLoaded = ref(false);
const loadGuard = createLoadGuard();

const identityName = computed(
  () =>
    (memberFieldVisible(detail.value?.fieldAccess, "displayName")
      ? detail.value?.record.displayName
      : undefined) ||
    detail.value?.record.username ||
    detail.value?.record.id ||
    "",
);
const identityAvatar = computed(
  () =>
    (editing.value && canEditField("avatar") ? draft.avatar : detail.value?.record.avatar) || "",
);
const groupPreview = computed(() =>
  groupNames.value.length ? groupNames.value.join("、") : EMPTY_PREVIEW,
);
const overflowActions = computed(() => {
  if (!detail.value || detail.value.record.status === MemberStatus.REMOVED) {
    return [];
  }
  return createRowActions(detail.value, {
    onDetail: () => undefined,
    onSuspend: () => privateChangeStatus(MemberStatus.SUSPENDED, "暂停"),
    onRestore: () => privateChangeStatus(MemberStatus.ACTIVE, "恢复"),
    onRemove: () => privateRemove(),
  }).filter((action) => action.kind !== "detail");
});

const canEditProfile = computed(() => memberCanEditProfile(detail.value));
const canEditRoles = computed(
  () =>
    !!detail.value &&
    detail.value.record.status === MemberStatus.ACTIVE &&
    objectActionAllowed(detail.value.capabilities, IamAction.PLATFORM_MEMBER_UPDATE).allowed &&
    canReadDirect.value &&
    (canGrantDirect.value || canUpdateDirect.value || canRevokeDirect.value),
);
const canEditMember = computed(() => canEditProfile.value || canEditRoles.value);
const canEditField = (key: string): boolean =>
  canEditProfile.value && isFieldEditable(detail.value?.fieldAccess, key);
const applyDraft = (value: ResourceDetail<MemberRecord>): void => {
  Object.assign(draft, memberProfileDraft(value));
  draft.status = value.record.status;
};
const privateEnterEdit = (): void => {
  if (!canEditMember.value || !detail.value) return;
  applyDraft(detail.value);
  roleState.value = undefined;
  session.enterEdit();
};

const loadGroups = (): void => {
  const id = detail.value?.record.id;
  if (!id || groupsLoaded.value) {
    return;
  }
  collectIamPageRecords((page) => PlatformMemberGroupsAPI(id, page)).then((records) => {
    groupNames.value = records.map((item) => item.record.name);
    groupsLoaded.value = true;
  });
};

const load = (id: string): void => {
  const guard = loadGuard.begin();
  loading.value = true;
  detail.value = undefined;
  draft.displayName = "";
  draft.phone = "";
  draft.email = "";
  draft.avatar = undefined;
  draft.status = null;
  roleState.value = undefined;
  groupNames.value = [];
  groupsLoaded.value = false;
  PlatformMemberDetailAPI(id)
    .then((response) => {
      if (!guard.isCurrent()) {
        return;
      }
      detail.value = response.data;
      applyDraft(response.data);
    })
    .finally(() => {
      if (guard.isCurrent()) {
        loading.value = false;
        if (tab.value === "other") {
          loadGroups();
        }
      }
    });
};

watch(tab, (name) => {
  if (name === "other") {
    loadGroups();
  }
});

const privateCancel = (): void => {
  session.exitEdit();
  roleState.value = undefined;
  if (detail.value) {
    applyDraft(detail.value);
  }
};

const privateFinish = (): void => {
  Message.success("保存成功");
  session.exitEdit();
  void queryClient.invalidateQueries({ queryKey: platformMemberQueryKeys.lists() });
  emits("success");
};

const privateSave = async (): Promise<void> => {
  const current = detail.value;
  if (!current || !canEditMember.value || session.saving.value) return;
  const patch = memberProfilePatch(current, draft);
  if (patch.displayName !== undefined && !patch.displayName) {
    Message.warning("请输入显示名");
    return;
  }
  const changes = roleState.value ? memberRoleChanges(roleState.value) : undefined;
  const rolesChanged = hasMemberRoleChanges(changes);
  if (!Object.keys(patch).length && !rolesChanged) {
    session.exitEdit();
    return;
  }
  session.saving.value = true;
  try {
    const input = {
      expectedVersion: current.version,
      ...patch,
      ...(rolesChanged ? { roleChanges: changes } : {}),
    };
    if (rolesChanged) {
      const preview = await PlatformMemberEditPreviewAPI(current.record.id, input);
      if (!preview.data.valid) {
        Message.warning(preview.data.errors[0]?.message || "角色配置未通过预览，请检查范围");
        return;
      }
      const impact = preview.data.effectiveResult;
      await Confirm.warning(
        `本次新增 ${impact?.additions || 0} 条、调整范围 ${impact?.updates || 0} 条、移除 ${impact?.removals || 0} 条角色分配。与成员资料一起保存？`,
      );
      const latest = roleState.value ? memberRoleChanges(roleState.value) : undefined;
      if (
        JSON.stringify(latest) !== JSON.stringify(changes) ||
        JSON.stringify(memberProfilePatch(current, draft)) !== JSON.stringify(patch)
      ) {
        Message.warning("草稿已变化，请重新保存并预览");
        return;
      }
    }
    const response = await PlatformMemberUpdateAPI(current.record.id, input);
    detail.value = response.data;
    applyDraft(response.data);
    roleState.value = undefined;
    await rolesField.value?.refresh();
    privateFinish();
  } catch (error: unknown) {
    if (isApiError(error) && error.status === 403) await refreshEligibility();
    // 网络层统一显示错误，保留当前草稿供用户检查。
  } finally {
    session.saving.value = false;
  }
};

const privateChangeStatus = (
  status: MemberStatus.ACTIVE | MemberStatus.SUSPENDED,
  label: string,
): void => {
  if (!detail.value) {
    return;
  }
  Confirm.warning(`是否${label}平台成员（${identityName.value}）？`).then(() => {
    PlatformMemberStatusAPI(detail.value!.record.id, {
      expectedVersion: detail.value!.version,
      status,
    }).then(() => {
      Message.success(`已${label}`);
      load(detail.value!.record.id);
      void queryClient.invalidateQueries({ queryKey: platformMemberQueryKeys.lists() });
      emits("success");
    });
  });
};

const privateRemove = (): void => {
  if (!detail.value) {
    return;
  }
  Confirm.error(`移出不删除全局账号。是否移出（${identityName.value}）？`, {
    confirmButtonText: "移出",
  }).then(() => {
    PlatformMemberRemoveAPI(detail.value!.record.id, {
      expectedVersion: detail.value!.version,
    }).then(() => {
      Message.success("已移出");
      visible.value = false;
      void queryClient.invalidateQueries({ queryKey: platformMemberQueryKeys.lists() });
      emits("success");
    });
  });
};

const privateOnMoreCommand = (command: string | number | object): void => {
  const action = overflowActions.value.find((item) => item.key === command);
  if (!detail.value || !action) {
    return;
  }
  action.onSelect(detail.value);
};

defineExpose({
  show(row: Row) {
    void refreshEligibility();
    visible.value = true;
    tab.value = "basic";
    session.exitEdit();
    load(row.record.id);
  },
});
</script>

<style lang="postcss" scoped>
.is-danger {
  color: var(--in-color-danger);
}
</style>
