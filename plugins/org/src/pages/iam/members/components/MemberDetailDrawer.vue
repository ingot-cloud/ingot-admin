<template>
  <in-detail-drawer
    v-model="visible"
    v-model:tab="tab"
    v-model:editing="editing"
    title="成员详情"
    edit-label="编辑基本信息"
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
        upload-dir="user/avatar"
        :show-avatar="isFieldVisible(detail?.fieldAccess, 'avatar')"
        :editable="editing && canEditField('avatar')"
        @update:avatar="dirty.add('avatar')"
      >
        <template #status>
          <span class="inline-flex items-center gap-8px">
            <status-tag
              v-if="detail && memberStatusTone(detail.record.status)"
              :tone="statusToneOf(detail.record.status)"
              :label="memberStatusEnum.getTagText(detail.record.status).text"
            />
            <el-tag v-if="isOwner">组织拥有者</el-tag>
          </span>
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
                  <span :class="action.kind === 'danger' ? 'text-[var(--in-color-danger)]' : ''">{{
                    action.label
                  }}</span>
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
          v-if="isFieldVisible(detail.fieldAccess, 'displayName')"
          label="显示名"
          :value="detail.record.displayName || detail.record.id"
        >
          <el-input
            v-model="draft.displayName"
            :disabled="!canEditField('displayName')"
            :placeholder="canEditField('displayName') ? '请输入显示名' : '不可修改'"
            clearable
            @update:model-value="dirty.add('displayName')"
          />
        </in-detail-field>
        <in-detail-field
          v-if="isFieldVisible(detail.fieldAccess, 'phone')"
          label="手机号"
          :value="detail.record.phone"
        >
          <el-input
            v-model="draft.phone"
            :disabled="!canEditField('phone')"
            :placeholder="canEditField('phone') ? '请输入手机号' : '不可修改'"
            clearable
            @update:model-value="dirty.add('phone')"
          />
        </in-detail-field>
        <in-detail-field
          v-if="isFieldVisible(detail.fieldAccess, 'email')"
          label="邮箱"
          :value="detail.record.email"
        >
          <el-input
            v-model="draft.email"
            :disabled="!canEditField('email')"
            :placeholder="canEditField('email') ? '请输入邮箱' : '不可修改'"
            clearable
            @update:model-value="dirty.add('email')"
          />
        </in-detail-field>
        <in-detail-field v-if="editing && canEditDepartments" label="部门" :value="departmentText">
          <member-department-field v-model="departmentDraft" />
        </in-detail-field>
        <in-detail-field v-else label="部门" :value="departmentText" />
      </in-form>
    </in-biz-tab-panel>

    <in-biz-tab-panel title="其他" name="other" :editable="false">
      <in-form>
        <in-detail-field label="用户组" :value="groupPreview" />
        <template v-if="detail">
          <in-detail-field label="入职时间" :value="formatDateTime(detail.record.joinedAt)" />
          <in-detail-field
            label="账号最后登录时间"
            :value="formatDateTime(detail.record.lastLoginAt, { fallback: '暂无登录记录' })"
          />
          <div class="text-12px text-[var(--el-text-color-secondary)]">包含平台及组织身份登录。</div>
          <in-detail-field label="成员更新时间" :value="formatDateTime(detail.record.updatedAt)" />
        </template>
      </in-form>
    </in-biz-tab-panel>
  </in-detail-drawer>
</template>

<script setup lang="ts">
import { formatDateTime } from "@ingot/shared";
import {
  Confirm,
  Message,
  StatusTag,
  createLoadGuard,
  useDetailEditSession,
  usePermissions,
} from "@ingot/admin-core";
import {
  collectIamPageRecords,
  fieldTextDraft,
  fieldTextPatch,
  isFieldEditable,
  isFieldVisible,
  IamAction,
  MemberStatus,
  memberStatusTone,
  useMemberStatusEnum,
  type MemberDepartmentView,
  type MemberRecord,
  type ResourceDetail,
} from "@ingot/admin-common";
import {
  TenantMemberDepartmentsAPI,
  TenantMemberDetailAPI,
  TenantMemberGroupsAPI,
  TenantMemberRemoveAPI,
  TenantMemberStatusAPI,
  TenantMemberUpdateAPI,
} from "@/api/iam/directory";
import { formatMemberDepartments, createRowActions, type Row } from "../memberTable";
import { sameDepartmentOrder } from "../departmentSelection";
import MemberDepartmentField from "./MemberDepartmentField.vue";

defineOptions({ name: "MemberDetailDrawer" });

const permissions = usePermissions();
const emits = defineEmits<{ success: [] }>();
const session = useDetailEditSession();
const { editing } = session;
const visible = ref(false);
const listStale = ref(false);
const tab = ref("basic");
const loading = ref(false);
const detail = ref<ResourceDetail<MemberRecord>>();
const departmentDraft = ref<MemberDepartmentView[]>([]);
const memberStatusEnum = useMemberStatusEnum();
const statusToneOf = (status: string): "info" | "warning" | "danger" =>
  memberStatusTone(status) ?? "info";
const draft = reactive({
  displayName: "",
  phone: "",
  email: "",
  avatar: undefined as string | undefined,
});
const bindings = {
  displayName: "displayName",
  avatar: "avatar",
  phone: "phone",
  email: "email",
} as const;
type ProfileKey = keyof typeof bindings;
const dirty = reactive(new Set<ProfileKey>());
const groupNames = ref<string[]>([]);
const groupsLoaded = ref(false);
const loadGuard = createLoadGuard();
const EMPTY_PREVIEW = "-";

const identityName = computed(
  () =>
    (isFieldVisible(detail.value?.fieldAccess, "displayName")
      ? detail.value?.record.displayName
      : undefined) ||
    detail.value?.record.id ||
    "",
);
const identityAvatar = computed(
  () =>
    (editing.value && canEditField("avatar") ? draft.avatar : detail.value?.record.avatar) || "",
);
const ownerMemberId = computed(() =>
  permissions.tenantOwner && permissions.memberId ? permissions.memberId : undefined,
);
const isOwner = computed(
  () => detail.value?.record.id !== undefined && detail.value.record.id === ownerMemberId.value,
);
const departmentText = computed(() => formatMemberDepartments(detail.value?.record.departments));
const groupPreview = computed(() =>
  groupNames.value.length ? groupNames.value.join("、") : EMPTY_PREVIEW,
);
const overflowActions = computed(() => {
  if (!detail.value || detail.value.record.status === MemberStatus.REMOVED) {
    return [];
  }
  return createRowActions(
    detail.value,
    {
      onDetail: () => undefined,
      onSuspend: () => privateChangeStatus(MemberStatus.SUSPENDED, "暂停"),
      onRestore: () => privateChangeStatus(MemberStatus.ACTIVE, "恢复"),
      onRemove: () => privateRemove(),
    },
    ownerMemberId.value,
  ).filter((action) => action.kind !== "detail");
});
const canEditProfile = computed(
  () =>
    detail.value?.capabilities[IamAction.TENANT_MEMBER_UPDATE]?.allowed === true &&
    (Object.keys(bindings) as ProfileKey[]).some((key) =>
      isFieldEditable(detail.value?.fieldAccess, key),
    ),
);
const canEditDepartments = computed(
  () =>
    detail.value?.capabilities[IamAction.TENANT_MEMBER_DEPARTMENTS]?.allowed === true &&
    detail.value.record.status !== MemberStatus.REMOVED,
);
const canEditMember = computed(() => canEditProfile.value || canEditDepartments.value);
const canEditField = (key: ProfileKey): boolean =>
  canEditProfile.value && isFieldEditable(detail.value?.fieldAccess, key);

const applyDraft = (value: ResourceDetail<MemberRecord>): void => {
  dirty.clear();
  const safe = fieldTextDraft(value.record, bindings, value.fieldAccess);
  draft.displayName = safe.displayName ?? "";
  draft.phone = safe.phone ?? "";
  draft.email = safe.email ?? "";
  draft.avatar = safe.avatar || undefined;
  departmentDraft.value = value.record.departments.map((item) => ({ ...item }));
};

const privateEnterEdit = (): void => {
  if (!canEditMember.value || !detail.value) {
    return;
  }
  applyDraft(detail.value);
  session.enterEdit();
};

const loadGroups = (): void => {
  const id = detail.value?.record.id;
  if (!id || groupsLoaded.value) {
    return;
  }
  collectIamPageRecords((page) => TenantMemberGroupsAPI(id, page))
    .then((records) => {
      groupNames.value = records.map((item) => item.record.name);
      groupsLoaded.value = true;
    })
    .catch(() => undefined);
};

const load = (id: string): void => {
  const guard = loadGuard.begin();
  loading.value = true;
  detail.value = undefined;
  departmentDraft.value = [];
  draft.displayName = "";
  draft.phone = "";
  draft.email = "";
  draft.avatar = undefined;
  groupNames.value = [];
  groupsLoaded.value = false;
  TenantMemberDetailAPI(id)
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
  if (detail.value) {
    applyDraft(detail.value);
  }
};

const privateFinish = (message: string): void => {
  Message.success(message);
  session.exitEdit();
  listStale.value = true;
};

watch(visible, (open) => {
  if (open || !listStale.value) {
    return;
  }
  listStale.value = false;
  emits("success");
});

const privateReload = (id: string): void => {
  const guard = loadGuard.begin();
  TenantMemberDetailAPI(id)
    .then((response) => {
      if (!guard.isCurrent()) {
        return;
      }
      detail.value = response.data;
      applyDraft(response.data);
      groupsLoaded.value = false;
      groupNames.value = [];
      if (tab.value === "other") {
        loadGroups();
      }
    })
    .catch(() => undefined);
};

const privateSave = async (): Promise<void> => {
  const current = detail.value;
  if (!current || !canEditMember.value || session.saving.value) {
    return;
  }
  const access = current.fieldAccess;
  const initial = fieldTextDraft(current.record, bindings, access);
  const patch = canEditProfile.value
    ? fieldTextPatch(
        {
          displayName: draft.displayName.trim(),
          avatar: draft.avatar,
          phone: draft.phone.trim(),
          email: draft.email.trim(),
        },
        initial,
        bindings,
        access,
        dirty,
        new Set<ProfileKey>(["avatar", "phone", "email"]),
      )
    : {};
  if (patch.displayName !== undefined && !patch.displayName) {
    Message.warning("请输入显示名");
    return;
  }
  const departmentsChanged =
    canEditDepartments.value &&
    !sameDepartmentOrder(departmentDraft.value, current.record.departments);
  if (!Object.keys(patch).length && !departmentsChanged) {
    session.exitEdit();
    return;
  }
  session.saving.value = true;
  try {
    let version = current.version;
    if (Object.keys(patch).length) {
      const response = await TenantMemberUpdateAPI(current.record.id, {
        expectedVersion: version,
        ...patch,
      });
      version = response.data.version;
    }
    if (departmentsChanged) {
      await TenantMemberDepartmentsAPI(current.record.id, {
        expectedVersion: version,
        departments: departmentDraft.value.map((item, index) => ({
          id: item.id,
          primary: index === 0,
        })),
      });
    }
    privateFinish("保存成功");
    privateReload(current.record.id);
  } catch {
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
  const name = identityName.value;
  const verb = status === MemberStatus.SUSPENDED ? "暂停只影响组织身份，不删除全局账号。是否暂停" : "是否恢复组织成员";
  Confirm.warning(`${verb}（${name}）？`).then(() => {
    const current = detail.value;
    if (!current) {
      return;
    }
    TenantMemberStatusAPI(current.record.id, {
      expectedVersion: current.version,
      status,
    }).then(() => {
      Message.success(`已${label}`);
      listStale.value = true;
      load(current.record.id);
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
    const current = detail.value;
    if (!current) {
      return;
    }
    TenantMemberRemoveAPI(current.record.id, { expectedVersion: current.version }).then(() => {
      Message.success("已移出");
      listStale.value = true;
      visible.value = false;
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
    visible.value = true;
    tab.value = "basic";
    session.exitEdit();
    load(row.record.id);
  },
});
</script>
