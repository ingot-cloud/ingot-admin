<template>
  <in-detail-drawer
    v-model="visible"
    v-model:tab="tab"
    v-model:editing="editing"
    title="成员详情"
    edit-label="编辑基本信息"
    :loading="loading"
    :saving="session.saving.value"
    @edit="session.enterEdit"
    @cancel="privateCancel"
    @save="privateSave"
  >
    <template #identity>
      <in-detail-identity
        :name="identityName"
        :src="identityAvatar"
        v-model:avatar="draft.avatar"
        :editable="editing"
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

    <in-biz-tab-panel title="基本信息" name="basic">
      <in-form v-if="detail" :editing="editing">
        <in-detail-field label="显示名" :value="detail.record.displayName || detail.record.id">
          <el-input v-model="draft.displayName" clearable placeholder="请输入显示名" />
        </in-detail-field>
        <in-detail-field label="登录名" :value="detail.record.username || '-'" />
        <in-detail-field label="手机号" :value="detail.record.phone">
          <el-input v-model="draft.phone" clearable placeholder="请输入手机号" />
        </in-detail-field>
        <in-detail-field label="邮箱" :value="detail.record.email">
          <el-input v-model="draft.email" clearable placeholder="请输入邮箱" />
        </in-detail-field>
        <in-detail-field label="角色" :value="rolePreview">
          <biz-iam-option-tag-field
            v-if="canReplaceDirect"
            v-model="draftRoles"
            placeholder="请选择角色"
            @pick="privatePickRoles"
          />
          <span v-else>{{ rolePreview }}（只读）</span>
        </in-detail-field>
        <el-form-item v-if="canOpenAssignment" label="参数化角色分配">
          <in-button @click="openAssignment">前往角色分配</in-button>
        </el-form-item>
        <in-detail-field label="状态">
          <template #view>
            <status-tag
              v-if="memberStatusTone(detail.record.status)"
              :tone="statusToneOf(detail.record.status)"
              :label="memberStatusEnum.getTagText(detail.record.status).text"
            />
          </template>
          <el-select
            v-if="detail.record.status !== MemberStatus.REMOVED"
            v-model="draft.status"
            clearable
            placeholder="请选择状态"
            class="w-full"
          >
            <el-option
              v-for="option in memberStatusEnum.getOptions()"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
          <status-tag
            v-else
            :tone="statusToneOf(detail.record.status)"
            :label="memberStatusEnum.getTagText(detail.record.status).text"
          />
        </in-detail-field>
      </in-form>
    </in-biz-tab-panel>
    <in-biz-tab-panel title="其他" name="other" :editable="false">
      <in-form>
        <in-detail-field label="用户组" :value="groupPreview" />
      </in-form>
    </in-biz-tab-panel>
  </in-detail-drawer>
  <biz-iam-member-picker-dialog
    ref="rolePickerRef"
    title="选择角色"
    search-placeholder="请输入角色名称"
    empty-text="暂无角色"
    selected-unit="个角色"
    :show-avatar="false"
    :load-members="loadPlatformRoleOptions"
    @confirm="privateOnRolesConfirm"
  />
</template>

<script setup lang="ts">
import { useDirectRoleEligibility } from "../useDirectRoleEligibility";
import { useCapabilities, useGo } from "@ingot/admin-core";
import {
  Confirm,
  Message,
  StatusTag,
  createLoadGuard,
  useDetailEditSession,
} from "@ingot/admin-core";
import {
  BizIamMemberPickerDialog,
  BizIamOptionTagField,
  collectIamPageRecords,
  MemberStatus,
  IamAction,
  editablePatch,
  memberStatusTone,
  useMemberStatusEnum,
  type IamSelectOption,
  type MemberRecord,
  type ResourceDetail,
} from "@ingot/admin-common";
import {
  PlatformMemberDetailAPI,
  PlatformMemberGroupsAPI,
  PlatformMemberRemoveAPI,
  PlatformMemberRolesAPI,
  PlatformMemberRolesReplaceAPI,
  PlatformMemberStatusAPI,
  PlatformMemberUpdateAPI,
} from "@/api/iam/personnel";
import { platformMemberQueryKeys } from "@/api/iam/personnel.query";
import { useQueryClient } from "@tanstack/vue-query";
import { loadPlatformRoleOptions } from "../iamMemberOptions";
import { createRowActions, type Row } from "../table";

defineOptions({ name: "MemberDetailDrawer" });

const { canReplaceDirect, refresh: refreshEligibility } = useDirectRoleEligibility();
const { hasAction: hasAssignmentAction } = useCapabilities();
const goAssignments = useGo();
const canOpenAssignment = computed(() => hasAssignmentAction(IamAction.PLATFORM_ASSIGNMENT_CREATE));
const openAssignment = (): void => {
  if (detail.value && canOpenAssignment.value)
    goAssignments({
      name: "platform.iam.authorization",
      query: { assignmentMemberId: detail.value.record.id },
    });
};
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
const savedRoles = ref<IamSelectOption[]>([]);
const draftRoles = ref<IamSelectOption[]>([]);
const groupNames = ref<string[]>([]);
const groupsLoaded = ref(false);
const rolePickerRef = ref<{ show: (current: IamSelectOption[]) => void }>();
const loadGuard = createLoadGuard();

const identityName = computed(
  () => detail.value?.record.displayName || detail.value?.record.id || "",
);
const identityAvatar = computed(
  () => (editing.value ? draft.avatar : detail.value?.record.avatar) || "",
);
const rolePreview = computed(() =>
  savedRoles.value.length ? savedRoles.value.map((item) => item.name).join("、") : EMPTY_PREVIEW,
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

const applyDraft = (record: MemberRecord): void => {
  draft.displayName = record.displayName ?? "";
  draft.phone = record.phone ?? "";
  draft.email = record.email ?? "";
  draft.avatar = record.avatar;
  draft.status = record.status;
};

const applyRoles = (roles: IamSelectOption[]): void => {
  savedRoles.value = roles.map((item) => ({ ...item }));
  draftRoles.value = roles.map((item) => ({ ...item }));
};

const sameRoleIds = (left: IamSelectOption[], right: IamSelectOption[]): boolean => {
  if (left.length !== right.length) {
    return false;
  }
  const expected = new Set(right.map((item) => item.id));
  return left.every((item) => expected.has(item.id));
};

const loadRoles = (id: string): Promise<void> =>
  PlatformMemberRolesAPI(id).then((response) => {
    applyRoles(response.data ?? []);
  });

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
  applyRoles([]);
  groupNames.value = [];
  groupsLoaded.value = false;
  PlatformMemberDetailAPI(id)
    .then((response) => {
      if (!guard.isCurrent()) {
        return;
      }
      detail.value = response.data;
      applyDraft(response.data.record);
      return loadRoles(id);
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
  if (detail.value) {
    applyDraft(detail.value.record);
  }
  draftRoles.value = savedRoles.value.map((item) => ({ ...item }));
};

const privateFinish = (): void => {
  Message.success("保存成功");
  session.exitEdit();
  void queryClient.invalidateQueries({ queryKey: platformMemberQueryKeys.lists() });
  emits("success");
};

const privateSaveRoles = (): Promise<void> => {
  if (!canReplaceDirect.value || !detail.value || sameRoleIds(draftRoles.value, savedRoles.value)) {
    return Promise.resolve();
  }
  return PlatformMemberRolesReplaceAPI(detail.value.record.id, {
    roleIds: draftRoles.value.map((item) => item.id),
  }).then((response) => {
    applyRoles(response.data ?? []);
  });
};

const privateSave = (): void => {
  if (!detail.value) {
    return;
  }
  const current = detail.value;
  const displayName = draft.displayName.trim();
  if (!displayName) {
    Message.warning("请输入显示名");
    return;
  }
  if (current.record.status !== MemberStatus.REMOVED && !draft.status) {
    Message.warning("请选择状态");
    return;
  }
  const nextStatus = draft.status;
  if (
    current.record.status === MemberStatus.REMOVED &&
    nextStatus &&
    nextStatus !== MemberStatus.REMOVED
  ) {
    Message.warning("已移出的成员不能恢复");
    return;
  }
  const next = {
    displayName,
    phone: draft.phone.trim(),
    email: draft.email.trim(),
    avatar: draft.avatar ?? "",
  };
  const profileChanged =
    next.displayName !== (current.record.displayName ?? "") ||
    next.phone !== (current.record.phone ?? "") ||
    next.email !== (current.record.email ?? "") ||
    next.avatar !== (current.record.avatar ?? "");
  const statusChanged = Boolean(nextStatus) && nextStatus !== current.record.status;
  const rolesChanged = !sameRoleIds(draftRoles.value, savedRoles.value);
  if (!profileChanged && !statusChanged && !rolesChanged) {
    session.exitEdit();
    return;
  }
  const access = current.fieldAccess;
  const patch = Object.keys(access).length
    ? editablePatch(next, access, ["displayName", "phone", "email", "avatar"])
    : next;
  session.saving.value = true;
  const saveProfile = profileChanged
    ? PlatformMemberUpdateAPI(current.record.id, {
        expectedVersion: current.version,
        ...patch,
      })
    : Promise.resolve(null);
  saveProfile
    .then((response) => {
      const version = response?.data.version ?? current.version;
      if (!statusChanged || !nextStatus) {
        if (response) {
          detail.value = response.data;
          applyDraft(response.data.record);
        }
        return;
      }
      if (nextStatus === MemberStatus.REMOVED) {
        return PlatformMemberRemoveAPI(current.record.id, { expectedVersion: version }).then(() => {
          visible.value = false;
        });
      }
      return PlatformMemberStatusAPI(current.record.id, {
        expectedVersion: version,
        status: nextStatus,
      })
        .then(() => PlatformMemberDetailAPI(current.record.id))
        .then((reloaded) => {
          detail.value = reloaded.data;
          applyDraft(reloaded.data.record);
        });
    })
    .then(() => privateSaveRoles())
    .then(() => {
      privateFinish();
    })
    .catch(() => undefined)
    .finally(() => {
      session.saving.value = false;
    });
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

const privatePickRoles = (): void => {
  rolePickerRef.value?.show(draftRoles.value);
};

const privateOnRolesConfirm = (selected: IamSelectOption[]): void => {
  draftRoles.value = selected;
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
