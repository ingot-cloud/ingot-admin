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
        <in-detail-field label="联系手机号" :value="detail.record.phone">
          <el-input v-model="draft.phone" clearable placeholder="请输入联系手机号" />
        </in-detail-field>
        <in-detail-field label="联系邮箱" :value="detail.record.email">
          <el-input v-model="draft.email" clearable placeholder="请输入联系邮箱" />
        </in-detail-field>
        <div class="text-12px text-[var(--el-text-color-secondary)]">
          仅用于平台联系，不影响全局账号登录信息。
        </div>
        <el-form-item label="角色分配">
          <div class="w-full flex flex-col gap-8px">
            <div
              v-for="item in assignments"
              :key="item.record.id"
              class="flex items-center gap-8px"
            >
              <span class="flex-1">
                {{ item.record.roleName || item.record.assignment.roleRevisionRef.id }}
                · v{{ item.record.revisionNumber || "-" }}
                · {{ item.record.effectiveStatus || item.record.status }}
              </span>
              <in-button
                v-if="privateCanRevoke(item)"
                text
                type="danger"
                @in-click="privateRevoke(item)"
              >撤销</in-button>
            </div>
            <span v-if="!canReadAssignments" class="text-[var(--el-text-color-secondary)]">
              {{ simpleRoleNames.join("、") || "角色分配只读" }}
            </span>
            <span v-else-if="!assignments.length" class="text-[var(--el-text-color-secondary)]">暂无角色分配</span>
            <in-button
              v-if="canGrantDirect && canReadAssignments"
              :disabled="assignmentSaving"
              @in-click="rolePickerRef?.show()"
            >添加角色</in-button>
            <el-pagination
              v-if="assignmentTotal > 20"
              :current-page="assignmentPage"
              :page-size="20"
              :total="assignmentTotal"
              layout="prev, pager, next"
              small
              @current-change="privateAssignmentPage"
            />
          </div>
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
  <member-role-assign-dialog
    ref="rolePickerRef"
    :selected-role-ids="[]"
    @confirm="privateOnRoleConfirm"
  />
</template>

<script setup lang="ts">
import { useDirectRoleEligibility } from "../useDirectRoleEligibility";
import { useCapabilities } from "@ingot/admin-core";
import {
  Confirm,
  Message,
  StatusTag,
  createLoadGuard,
  objectActionAllowed,
  useDetailEditSession,
} from "@ingot/admin-core";
import {
  collectIamPageRecords,
  MemberStatus,
  IamAction,
  SubjectType,
  editablePatch,
  memberStatusTone,
  useMemberStatusEnum,
  type AssignmentRecord,
  type MemberRoleAssignmentDraft,
  type MemberRecord,
  type ResourceDetail,
} from "@ingot/admin-common";
import {
  PlatformMemberDetailAPI,
  PlatformMemberGroupsAPI,
  PlatformMemberAssignmentsAPI,
  PlatformMemberRolesAPI,
  PlatformMemberRemoveAPI,
  PlatformMemberStatusAPI,
  PlatformMemberUpdateAPI,
} from "@/api/iam/personnel";
import { platformMemberQueryKeys } from "@/api/iam/personnel.query";
import { useQueryClient } from "@tanstack/vue-query";
import {
  PlatformAssignmentCreateAPI,
  PlatformAssignmentDeleteAPI,
  PlatformAssignmentPreviewAPI,
} from "@/api/iam/authorization";
import MemberRoleAssignDialog from "./MemberRoleAssignDialog.vue";
import { createRowActions, type Row } from "../table";

defineOptions({ name: "MemberDetailDrawer" });

const { canGrantDirect, refresh: refreshEligibility } = useDirectRoleEligibility();
const { hasAction } = useCapabilities();
const canReadAssignments = computed(() => hasAction(IamAction.PLATFORM_ASSIGNMENT_READ));
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
const assignments = ref<ResourceDetail<AssignmentRecord>[]>([]);
const simpleRoleNames = ref<string[]>([]);
const assignmentTotal = ref(0);
const assignmentPage = ref(1);
const assignmentSaving = ref(false);
const groupNames = ref<string[]>([]);
const groupsLoaded = ref(false);
const rolePickerRef = ref<{ show: () => void }>();
const loadGuard = createLoadGuard();

const identityName = computed(
  () => detail.value?.record.displayName || detail.value?.record.id || "",
);
const identityAvatar = computed(
  () => (editing.value ? draft.avatar : detail.value?.record.avatar) || "",
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

const loadAssignments = (id: string): Promise<void> =>
  PlatformMemberAssignmentsAPI(id, { current: assignmentPage.value, size: 20 }).then((response) => {
    assignments.value = response.data.records ?? [];
    assignmentTotal.value = response.data.total ?? 0;
  });
const privateAssignmentPage = (page: number): void => {
  assignmentPage.value = page;
  if (detail.value) void loadAssignments(detail.value.record.id);
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
  assignments.value = [];
  simpleRoleNames.value = [];
  assignmentTotal.value = 0;
  assignmentPage.value = 1;
  groupNames.value = [];
  groupsLoaded.value = false;
  PlatformMemberDetailAPI(id)
    .then((response) => {
      if (!guard.isCurrent()) {
        return;
      }
      detail.value = response.data;
      applyDraft(response.data.record);
      return canReadAssignments.value
        ? loadAssignments(id)
        : PlatformMemberRolesAPI(id).then((roles) => {
            simpleRoleNames.value = roles.data.map((item) => item.name);
          });
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
};

const privateFinish = (): void => {
  Message.success("保存成功");
  session.exitEdit();
  void queryClient.invalidateQueries({ queryKey: platformMemberQueryKeys.lists() });
  emits("success");
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
  if (!profileChanged && !statusChanged) {
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

const privateCanRevoke = (item: ResourceDetail<AssignmentRecord>): boolean =>
  objectActionAllowed(item.capabilities, IamAction.PLATFORM_ASSIGNMENT_DELETE).allowed;
const privateOnRoleConfirm = async (role: MemberRoleAssignmentDraft & { name: string }): Promise<void> => {
  if (!detail.value || assignmentSaving.value) return;
  assignmentSaving.value = true;
  const assignment = {
    subject: { type: SubjectType.MEMBER, id: detail.value.record.id },
    roleRevisionRef: role.roleRevisionRef,
    scopeBindings: role.scopeBindings,
    validFrom: role.validFrom,
    validUntil: role.validUntil,
  };
  try {
    const preview = await PlatformAssignmentPreviewAPI({ items: [assignment] });
    if (!preview.data.valid) {
      Message.warning("当前角色或范围已变化，请重新选择");
      return;
    }
    await PlatformAssignmentCreateAPI({ items: [assignment] });
    Message.success("已分配角色");
    await loadAssignments(detail.value.record.id);
  } finally {
    assignmentSaving.value = false;
  }
};
const privateRevoke = (item: ResourceDetail<AssignmentRecord>): void => {
  if (!detail.value) return;
  Confirm.warning(`是否撤销角色分配（${item.record.roleName || item.record.id}）？`).then(async () => {
    await PlatformAssignmentDeleteAPI(item.record.id);
    Message.success("已撤销角色分配");
    if (detail.value) await loadAssignments(detail.value.record.id);
  });
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
