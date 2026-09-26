<template>
  <in-drawer v-model="visible" :title="editingProfile ? '' : '角色详情'" size="720px" layout="pinned" padding="0">
    <template v-if="editingProfile" #header>
      <div class="flex items-center gap-12px min-w-0">
        <button type="button" class="profile-back" aria-label="返回" @click="privateLeaveProfile">
          <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M16.293 2.293a1 1 0 0 1 0 1.414L8 12l8.293 8.293a1 1 0 0 1-1.414 1.414l-8.293-8.293a2 2 0 0 1 0-2.828l8.293-8.293a1 1 0 0 1 1.414 0Z"
              fill="currentColor"
            />
          </svg>
        </button>
        <span class="profile-title">编辑角色信息</span>
        <span class="text-[var(--el-text-color-secondary)]">角色详情</span>
      </div>
    </template>
    <div class="in-detail-drawer role-detail-drawer">
      <in-form-skeleton v-if="loading" />
      <div v-else-if="detail && !editingProfile" class="role-detail-drawer__body">
        <div class="role-detail-drawer__identity px-20px py-20px flex flex-col gap-8px">
          <div class="flex items-center gap-8px min-w-0 flex-wrap">
            <span class="text-18px truncate">{{ detail.record.name || "-" }}</span>
            <in-copy-tag v-if="detail.record.code" :text="detail.record.code" />
            <biz-iam-status-tag v-if="knownStatus(detail.record.status)" :status="detail.record.status" />
            <button
              v-if="canStatus"
              type="button"
              class="in-icon-button shrink-0"
              aria-label="编辑基本信息"
              @click="privateEnterProfile"
            >
              <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="m17.57 7.244-.006-.006.37-.37a1 1 0 0 0 .001-1.412l-3.434-3.453-.002-.002a1 1 0 0 0-1.414 0l-.705.706.01.01L2 13.186V17a1 1 0 0 0 1 1h3.814L17.57 7.244Zm-3.273.389-2.015-2.015 1.487-1.515 2.023 2.034-1.495 1.496Zm-3.415-.587 2.002 2.002-6.913 6.92h-.004l-1.934-1.935v-.003l6.849-6.984ZM3 20a1 1 0 1 0 0 2h18a1 1 0 1 0 0-2H3Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
          <div class="text-12px text-[var(--el-text-color-secondary)]">
            {{ detail.record.description || "暂无说明" }}
          </div>
        </div>
        <in-biz-tabs v-model="tab" align-content>
          <in-biz-tab-panel title="权限" name="grants" :editable="false" fill>
            <in-form-skeleton v-if="grantLoading" />
            <div v-else class="grant-pane">
              <div class="grant-pane__toolbar">
                <div>拥有 {{ grants.length }} 个权限</div>
                <in-button v-if="canPublish" @in-click="privateEditGrants">
                  <template #icon>
                    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="m17.57 7.244-.006-.006.37-.37a1 1 0 0 0 .001-1.412l-3.434-3.453-.002-.002a1 1 0 0 0-1.414 0l-.705.706.01.01L2 13.186V17a1 1 0 0 0 1 1h3.814L17.57 7.244Zm-3.273.389-2.015-2.015 1.487-1.515 2.023 2.034-1.495 1.496Zm-3.415-.587 2.002 2.002-6.913 6.92h-.004l-1.934-1.935v-.003l6.849-6.984ZM3 20a1 1 0 1 0 0 2h18a1 1 0 1 0 0-2H3Z"
                        fill="currentColor"
                      />
                    </svg>
                  </template>
                  编辑
                </in-button>
              </div>
              <div class="grant-pane__list">
                <grant-preview :grants="grants" />
              </div>
            </div>
          </in-biz-tab-panel>
          <in-biz-tab-panel title="版本历史" name="revisions" :editable="false" fill>
            <div class="embedded-table">
              <in-table
                :loading="revisionLoading"
                :data="revisionPage.records ?? []"
                :page="revisionPage"
                :headers="revisionHeaders"
                density="compact"
                :row-key="revisionKeyOf"
                @handleSizeChange="privateOnRevisionSizeChange"
                @handleCurrentChange="privateOnRevisionCurrentChange"
              >
                <template #revision="{ item }">{{ asRevision(item).record.revision }}</template>
                <template #id="{ item }">{{ asRevision(item).record.id }}</template>
                <template #deltas="{ item }">
                  <biz-iam-revision-delta-view
                    :items="displayDeltasOf(asRevision(item))"
                    :action-names="revisionActionNames"
                    :revision="asRevision(item).record.revision"
                    :initial="isInitialRevision(asRevision(item))"
                  />
                </template>
              </in-table>
            </div>
          </in-biz-tab-panel>
        </in-biz-tabs>
      </div>
      <div v-else-if="detail" class="profile-form">
        <in-form>
          <el-form-item label="名称" required>
            <el-input v-model="profileDraft.name" placeholder="请输入名称" :disabled="!canEditProfile" />
          </el-form-item>
          <el-form-item label="分组">
            <el-input v-model="profileDraft.groupName" placeholder="请输入分组，可空" :disabled="!canEditProfile" />
          </el-form-item>
          <el-form-item label="状态">
            <in-select v-model="profileDraft.status" :options="statusOptions" placeholder="请选择状态" />
          </el-form-item>
          <el-form-item label="说明">
            <el-input
              v-model="profileDraft.description"
              type="textarea"
              :rows="3"
              placeholder="请输入说明"
              :disabled="!canEditProfile"
            />
          </el-form-item>
        </in-form>
      </div>
    </div>
    <template v-if="editingProfile" #footer>
      <in-button @in-click="privateLeaveProfile">取消</in-button>
      <in-button
        type="primary"
        :loading="saving"
        :disabled="!profileDirty || !profileDraft.name.trim()"
        @in-click="privateSaveProfile"
      >
        保存
      </in-button>
    </template>
  </in-drawer>
  <grant-edit-wizard
    ref="grantWizardRef"
    :publish-api="resolvedPublishApi"
    :domain="grantDomain"
    @success="privateOnGrantSaved"
  />
</template>

<script setup lang="ts">
import {
  Message,
  createLoadGuard,
  type Page,
  type R,
  type TableHeaderRecord,
} from "@ingot/admin-core";
import {
  AuthorizationDomain,
  BizIamRevisionDeltaView,
  BizIamStatusTag,
  ConfigurationStatus,
  IAM_DEFAULT_PAGE_SIZE,
  IamAction,
  objectActionAllowed,
  useConfigurationStatusEnum,
  type ConfigurationStatusInput,
  type CreatedResource,
  type ResourceDetail,
  type RoleDelta,
  type RoleGrantList,
  type RolePublishInput,
  type RoleRevision,
  type RoleSummary,
  type RoleUpdateInput,
} from "@ingot/admin-common";
import {
  PlatformSharedRoleDetailAPI,
  PlatformSharedRoleGrantsAPI,
  PlatformSharedRoleRevisionPageAPI,
  PlatformSharedRoleUpdateAPI,
} from "@/api/iam/authorization";
import { selectedGrantsOf } from "../actionCatalog";
import GrantEditWizard from "./GrantEditWizard.vue";
import GrantPreview from "./GrantPreview.vue";
import type { SelectedGrant } from "../wizard";

defineOptions({ name: "SharedRoleDetailDrawer" });

const props = withDefaults(
  defineProps<{
    getApi?: (id: string) => Promise<R<ResourceDetail<RoleSummary>>>;
    listGrantsApi?: (id: string) => Promise<R<RoleGrantList>>;
    listRevisionsApi?: (id: string, page: Page) => Promise<R<Page<ResourceDetail<RoleRevision>>>>;
    updateApi?: (id: string, input: RoleUpdateInput) => Promise<R<CreatedResource>>;
    statusApi?: (id: string, input: ConfigurationStatusInput) => Promise<R<CreatedResource>>;
    publishApi?: (id: string, input: RolePublishInput) => Promise<R<CreatedResource>>;
    grantDomain?: AuthorizationDomain;
    statusAction?: string;
    publishAction?: string;
  }>(),
  {
    grantDomain: AuthorizationDomain.TENANT,
    statusAction: IamAction.PLATFORM_SHARED_ROLE_STATUS,
    publishAction: IamAction.PLATFORM_SHARED_ROLE_PUBLISH,
  },
);

const emits = defineEmits<{ success: [] }>();
const resolvedGetApi = computed(() => props.getApi ?? PlatformSharedRoleDetailAPI);
const resolvedGrantsApi = computed(() => props.listGrantsApi ?? PlatformSharedRoleGrantsAPI);
const resolvedRevisionsApi = computed(() => props.listRevisionsApi ?? PlatformSharedRoleRevisionPageAPI);
const resolvedPublishApi = computed(() => props.publishApi);
const canEditProfile = computed(() => Boolean(props.updateApi ?? !props.statusApi));
const visible = ref(false);
const tab = ref("grants");
const loading = ref(false);
const grantLoading = ref(false);
const saving = ref(false);
const editingProfile = ref(false);
const revisionLoading = ref(false);
const revisionsDirty = ref(true);
const loadGuard = createLoadGuard();
const grantGuard = createLoadGuard();
const revisionGuard = createLoadGuard();
const roleId = ref("");
const detail = ref<ResourceDetail<RoleSummary>>();
const grants = ref<SelectedGrant[]>([]);
const grantWizardRef = ref<{
  show: (input: {
    roleId: string;
    version: string;
    profile: { code: string; name: string; description: string; groupName: string };
    grants: SelectedGrant[];
  }) => void;
}>();
const statusEnum = useConfigurationStatusEnum();
const statusOptions = statusEnum.getOptions();
const profileDraft = reactive({
  name: "",
  groupName: "",
  description: "",
  status: ConfigurationStatus.ENABLED,
});
const revisionPage = ref<Page<ResourceDetail<RoleRevision>>>({
  current: 1,
  size: IAM_DEFAULT_PAGE_SIZE,
  total: 0,
  records: [],
});
const revisionHeaders: Array<TableHeaderRecord> = [
  { label: "版本", prop: "revision", width: 80 },
  { label: "版本 ID", prop: "id", minWidth: 180 },
  { label: "差异", prop: "deltas", minWidth: 160 },
];

const knownStatus = (status?: ConfigurationStatus): status is ConfigurationStatus =>
  status === ConfigurationStatus.ENABLED || status === ConfigurationStatus.DISABLED;

const canStatus = computed(
  () => objectActionAllowed(detail.value?.capabilities, props.statusAction).allowed,
);
const canPublish = computed(
  () => objectActionAllowed(detail.value?.capabilities, props.publishAction).allowed,
);

const profileDirty = computed(() => {
  const record = detail.value?.record;
  if (!record) {
    return false;
  }
  return (
    profileDraft.name.trim() !== (record.name ?? "") ||
    profileDraft.groupName.trim() !== (record.groupName ?? "") ||
    profileDraft.description.trim() !== (record.description ?? "") ||
    profileDraft.status !== record.status
  );
});

const revisionKeyOf = (row: ResourceDetail<RoleRevision>): string => row.record.id;
const asRevision = (row: unknown): ResourceDetail<RoleRevision> => row as ResourceDetail<RoleRevision>;
const displayDeltasOf = (row: ResourceDetail<RoleRevision>): RoleDelta[] => row.record.displayDeltas ?? [];
const isInitialRevision = (row: ResourceDetail<RoleRevision>): boolean =>
  Number(row.record.revision) === 1 && !(row.record.displayDeltas ?? []).length;
const revisionActionNames = computed(() => {
  const names: Record<string, string> = {};
  for (const row of revisionPage.value.records ?? []) {
    for (const delta of row.record.displayDeltas ?? []) {
      if (delta.actionName) {
        names[delta.actionId] = delta.actionName;
      }
    }
  }
  return names;
});

const fillProfile = (): void => {
  const record = detail.value?.record;
  profileDraft.name = record?.name ?? "";
  profileDraft.groupName = record?.groupName ?? "";
  profileDraft.description = record?.description ?? "";
  profileDraft.status = knownStatus(record?.status) ? record.status : ConfigurationStatus.ENABLED;
};

const assignRevisionPage = (page: Page<ResourceDetail<RoleRevision>>): void => {
  revisionPage.value = {
    current: page.current ?? 1,
    size: page.size ?? revisionPage.value.size ?? IAM_DEFAULT_PAGE_SIZE,
    total: page.total ?? 0,
    records: page.records ?? [],
  };
};

const load = (id: string): void => {
  const detailToken = loadGuard.begin();
  const grantsToken = grantGuard.begin();
  const size = revisionPage.value.size ?? IAM_DEFAULT_PAGE_SIZE;
  loading.value = true;
  grantLoading.value = true;
  revisionsDirty.value = true;
  detail.value = undefined;
  grants.value = [];
  revisionPage.value = { current: 1, size, total: 0, records: [] };
  resolvedGetApi
    .value(id)
    .then((role) => {
      if (!detailToken.isCurrent()) {
        return;
      }
      detail.value = role.data;
      fillProfile();
    })
    .finally(() => {
      if (detailToken.isCurrent()) {
        loading.value = false;
      }
    });
  resolvedGrantsApi
    .value(id)
    .then((response) => {
      if (!grantsToken.isCurrent()) {
        return;
      }
      grants.value = selectedGrantsOf(response.data?.items ?? []);
    })
    .finally(() => {
      if (grantsToken.isCurrent()) {
        grantLoading.value = false;
      }
    });
  if (tab.value === "revisions") {
    privateLoadRevisionPage();
  }
};

watch(tab, (name) => {
  if (name === "revisions" && revisionsDirty.value) {
    privateLoadRevisionPage();
  }
});

const privateLoadRevisionPage = (): void => {
  const id = roleId.value;
  if (!id) {
    return;
  }
  const guard = revisionGuard.begin();
  revisionLoading.value = true;
  resolvedRevisionsApi
    .value(id, {
      current: revisionPage.value.current ?? 1,
      size: revisionPage.value.size ?? IAM_DEFAULT_PAGE_SIZE,
    })
    .then((page) => {
      if (!guard.isCurrent()) {
        return;
      }
      assignRevisionPage(page.data);
      revisionsDirty.value = false;
    })
    .finally(() => {
      if (guard.isCurrent()) {
        revisionLoading.value = false;
      }
    });
};

const privateOnRevisionSizeChange = (payload: { value: number }): void => {
  revisionPage.value.size = payload.value;
  revisionPage.value.current = 1;
  privateLoadRevisionPage();
};

const privateOnRevisionCurrentChange = (payload: { value: number }): void => {
  revisionPage.value.current = payload.value;
  privateLoadRevisionPage();
};

const privateEnterProfile = (): void => {
  fillProfile();
  editingProfile.value = true;
};

const privateLeaveProfile = (): void => {
  fillProfile();
  editingProfile.value = false;
};

const privateSaveProfile = (): void => {
  if (!detail.value || !profileDirty.value || !profileDraft.name.trim()) {
    return;
  }
  saving.value = true;
  const request = canEditProfile.value
    ? (props.updateApi ?? PlatformSharedRoleUpdateAPI)(roleId.value, {
        expectedVersion: detail.value.version,
        name: profileDraft.name.trim(),
        description: profileDraft.description.trim() || undefined,
        groupName: profileDraft.groupName.trim() || undefined,
        status: profileDraft.status,
      })
    : props.statusApi?.(roleId.value, {
        expectedVersion: detail.value.version,
        status: profileDraft.status,
      });
  if (!request) {
    saving.value = false;
    return;
  }
  request
    .then(() => {
      Message.success("基本信息已更新");
      editingProfile.value = false;
      emits("success");
      load(roleId.value);
    })
    .finally(() => {
      saving.value = false;
    });
};

const privateEditGrants = (): void => {
  if (!detail.value) {
    return;
  }
  grantWizardRef.value?.show({
    roleId: roleId.value,
    version: detail.value.version,
    profile: {
      code: detail.value.record.code,
      name: detail.value.record.name,
      description: detail.value.record.description ?? "",
      groupName: detail.value.record.groupName ?? "",
    },
    grants: grants.value,
  });
};

const privateOnGrantSaved = (): void => {
  emits("success");
  load(roleId.value);
};

defineExpose<{ show: (id: string) => void }>({
  show(id: string) {
    roleId.value = id;
    visible.value = true;
    tab.value = "grants";
    editingProfile.value = false;
    load(id);
  },
});
</script>

<style lang="postcss" scoped>
.profile-back {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: var(--in-icon-button-size);
  height: var(--in-icon-button-size);
  padding: 0;
  border: 0;
  border-radius: var(--in-radius-control);
  background: transparent;
  font-size: 20px;
  color: #646a73;
  cursor: pointer;
  transition:
    background-color var(--in-motion-duration) var(--in-motion-ease),
    color var(--in-motion-duration) var(--in-motion-ease);
}

.profile-back:hover {
  background: var(--in-bg-color-hover);
  color: #1f2329;
}

.profile-back:active {
  background: var(--in-bg-color-active);
}

.profile-title {
  color: #1f2329;
  font-size: 16px;
}

.profile-form {
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  padding: var(--in-section-padding-relaxed);
}

.profile-form :deep(.in-detail-form),
.profile-form :deep(.el-form-item),
.profile-form :deep(.el-form-item__content),
.profile-form :deep(.el-input),
.profile-form :deep(.el-textarea),
.profile-form :deep(.el-select),
.profile-form :deep(.in-select) {
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

.profile-form :deep(.el-form-item__content) {
  margin-left: 0;
}

.profile-form :deep(.in-select) {
  --el-select-width: 100%;
}

.role-detail-drawer {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  height: 100%;
}

.role-detail-drawer__body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.role-detail-drawer__identity {
  flex-shrink: 0;
}

.grant-pane {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.grant-pane__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  margin-bottom: 16px;
}

.grant-pane__list {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.embedded-table {
  display: flex;
  flex-direction: column;
  min-height: 0;

  & :deep(.in-table) {
    flex: 1;
    min-height: 0;
    padding: 0;
  }
}
</style>
