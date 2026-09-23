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
        <template v-if="moreActions.length" #more>
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
                  v-for="action in moreActions"
                  :key="action.command"
                  :command="action.command"
                  :disabled="action.disabled"
                >
                  {{ action.label }}
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
        <in-detail-field label="登录名" :value="detail.record.username || '—'" />
        <in-detail-field label="手机号" :value="detail.record.phone">
          <el-input v-model="draft.phone" clearable placeholder="请输入手机号" />
        </in-detail-field>
        <in-detail-field label="邮箱" :value="detail.record.email">
          <el-input v-model="draft.email" clearable placeholder="请输入邮箱" />
        </in-detail-field>
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
    <in-biz-tab-panel title="其他" name="other" :editable="false" fill>
      <div class="embedded-table">
        <in-table
          :loading="groupsLoading"
          :data="groupsPage.records"
          :page="groupsPage"
          :headers="groupHeaders"
          density="compact"
          :row-key="groupKeyOf"
          @handleSizeChange="privateOnGroupsPage"
          @handleCurrentChange="privateOnGroupsPage"
        >
          <template #name="{ item }">{{ item.record.name }}</template>
        </in-table>
      </div>
    </in-biz-tab-panel>
  </in-detail-drawer>
</template>

<script setup lang="ts">
import { Confirm, Message, StatusTag, createLoadGuard, useDetailEditSession } from "@ingot/admin-core";
import type { Page } from "@ingot/admin-core";
import {
  IamAction,
  MemberStatus,
  editablePatch,
  memberStatusTone,
  objectActionAllowed,
  useMemberStatusEnum,
  type GroupRecord,
  type MemberRecord,
  type ResourceDetail,
} from "@ingot/admin-common";
import {
  PlatformMemberDetailAPI,
  PlatformMemberGroupsAPI,
  PlatformMemberRemoveAPI,
  PlatformMemberStatusAPI,
  PlatformMemberUpdateAPI,
} from "@/api/iam/personnel";
import { platformMemberQueryKeys } from "@/api/iam/personnel.query";
import { useQueryClient } from "@tanstack/vue-query";
import type { Row } from "../table";

defineOptions({ name: "MemberDetailDrawer" });

type MoreCommand = "suspend" | "restore" | "remove";

const groupHeaders = [{ label: "用户组", prop: "name", required: true }];

const emits = defineEmits<{ success: [] }>();
const queryClient = useQueryClient();
const session = useDetailEditSession();
const { editing } = session;
const visible = ref(false);
const tab = ref("basic");
const loading = ref(false);
const groupsLoading = ref(false);
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
const groupsPage = reactive<Page<ResourceDetail<GroupRecord>>>({
  current: 1,
  size: 20,
  total: 0,
  records: [],
});
const loadGuard = createLoadGuard();

const identityName = computed(() => detail.value?.record.displayName || detail.value?.record.id || "");
const identityAvatar = computed(() => (editing.value ? draft.avatar : detail.value?.record.avatar) || "");
const moreActions = computed(() => {
  if (!detail.value || detail.value.record.status === MemberStatus.REMOVED) {
    return [];
  }
  const status = objectActionAllowed(detail.value.capabilities, IamAction.PLATFORM_MEMBER_STATUS);
  const remove = objectActionAllowed(detail.value.capabilities, IamAction.PLATFORM_MEMBER_REMOVE);
  const actions: Array<{ command: MoreCommand; label: string; disabled: boolean }> = [];
  if (detail.value.record.status === MemberStatus.ACTIVE) {
    actions.push({ command: "suspend", label: "暂停", disabled: !status.allowed });
  }
  if (detail.value.record.status === MemberStatus.SUSPENDED) {
    actions.push({ command: "restore", label: "恢复", disabled: !status.allowed });
  }
  actions.push({ command: "remove", label: "移出", disabled: !remove.allowed });
  return actions;
});

const applyDraft = (record: MemberRecord): void => {
  draft.displayName = record.displayName ?? "";
  draft.phone = record.phone ?? "";
  draft.email = record.email ?? "";
  draft.avatar = record.avatar;
  draft.status = record.status;
};

const resetGroups = (): void => {
  groupsPage.current = 1;
  groupsPage.size = 20;
  groupsPage.total = 0;
  groupsPage.records = [];
};

const loadGroups = (): void => {
  const id = detail.value?.record.id;
  if (!id) {
    return;
  }
  groupsLoading.value = true;
  PlatformMemberGroupsAPI(id, groupsPage)
    .then((response) => {
      groupsPage.records = response.data.records ?? [];
      groupsPage.total = response.data.total ?? 0;
    })
    .finally(() => {
      groupsLoading.value = false;
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
  resetGroups();
  PlatformMemberDetailAPI(id)
    .then((response) => {
      if (!guard.isCurrent()) {
        return;
      }
      detail.value = response.data;
      applyDraft(response.data.record);
      loadGroups();
    })
    .finally(() => {
      if (guard.isCurrent()) {
        loading.value = false;
      }
    });
};

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

const privateChangeStatus = (status: MemberStatus.ACTIVE | MemberStatus.SUSPENDED, label: string): void => {
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
    PlatformMemberRemoveAPI(detail.value!.record.id, { expectedVersion: detail.value!.version }).then(() => {
      Message.success("已移出");
      visible.value = false;
      void queryClient.invalidateQueries({ queryKey: platformMemberQueryKeys.lists() });
      emits("success");
    });
  });
};

const privateOnMoreCommand = (command: string | number | object): void => {
  const action = command as MoreCommand;
  if (action === "suspend") {
    privateChangeStatus(MemberStatus.SUSPENDED, "暂停");
    return;
  }
  if (action === "restore") {
    privateChangeStatus(MemberStatus.ACTIVE, "恢复");
    return;
  }
  if (action === "remove") {
    privateRemove();
  }
};

const privateOnGroupsPage = (payload: { value: number; type: "size" | "current" }): void => {
  if (payload.type === "size") {
    groupsPage.size = payload.value;
    groupsPage.current = 1;
  } else {
    groupsPage.current = payload.value;
  }
  loadGroups();
};

const groupKeyOf = (row: ResourceDetail<GroupRecord>): string => row.record.id;

defineExpose({
  show(row: Row) {
    visible.value = true;
    tab.value = "basic";
    session.exitEdit();
    load(row.record.id);
  },
});
</script>

<style lang="postcss" scoped>
.embedded-table {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.embedded-table :deep(.in-table) {
  flex: 1;
  min-height: 0;
  padding: 0;
}
</style>
