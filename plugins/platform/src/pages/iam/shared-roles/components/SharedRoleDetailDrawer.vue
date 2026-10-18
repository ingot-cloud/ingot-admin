<template>
  <in-drawer
    v-model="visible"
    :title="editingProfile ? '' : '角色详情'"
    size="720px"
    layout="pinned"
    padding="0"
  >
    <template v-if="editingProfile" #header>
      <div class="flex items-center gap-12px min-w-0">
        <button type="button" class="profile-back" aria-label="返回" @click="privateLeaveProfile">
          <svg
            width="1em"
            height="1em"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
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
      <in-form-skeleton v-if="loading && !detail" />
      <div v-else-if="detailError && !detail" class="p-20px">
        <el-alert title="角色资料加载失败" type="error" :closable="false" />
        <in-button @in-click="privateLoadDetail()">重试</in-button>
      </div>
      <div v-else-if="detail && !editingProfile" class="role-detail-drawer__body">
        <div class="role-detail-drawer__identity px-20px py-20px flex flex-col gap-8px">
          <template v-if="detailError">
            <el-alert title="角色资料刷新失败" type="error" :closable="false" />
            <in-button @in-click="privateLoadDetail()">重试</in-button>
          </template>
          <div class="flex items-center gap-8px min-w-0 flex-wrap">
            <span class="text-18px truncate">{{ detail.record.name || "-" }}</span>
            <in-copy-tag v-if="detail.record.code" :text="detail.record.code" />
            <biz-iam-status-tag
              v-if="knownStatus(detail.record.status)"
              :status="detail.record.status"
            />
            <button
              v-if="canStatus"
              type="button"
              class="in-icon-button shrink-0"
              aria-label="编辑基本信息"
              @click="privateEnterProfile"
            >
              <svg
                width="1em"
                height="1em"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="m17.57 7.244-.006-.006.37-.37a1 1 0 0 0 .001-1.412l-3.434-3.453-.002-.002a1 1 0 0 0-1.414 0l-.705.706.01.01L2 13.186V17a1 1 0 0 0 1 1h3.814L17.57 7.244Zm-3.273.389-2.015-2.015 1.487-1.515 2.023 2.034-1.495 1.496Zm-3.415-.587 2.002 2.002-6.913 6.92h-.004l-1.934-1.935v-.003l6.849-6.984ZM3 20a1 1 0 1 0 0 2h18a1 1 0 1 0 0-2H3Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
          <div v-if="versioned && latestRevision" class="text-12px">
            最新发布版本：{{ roleVersionLabel(latestRevision) }}
          </div>
          <div v-else-if="versioned && grantLoading" class="text-12px">最新发布版本：加载中…</div>
          <div
            v-if="versioned && applicationApi && canApply"
            class="flex flex-wrap gap-8px text-12px"
          >
            <span>分配版本分布：</span>
            <span v-if="distributionLoading">加载中…</span>
            <template v-else-if="distributionError">
              <span>加载失败</span>
              <in-button link @in-click="privateLoadDistribution()">重试</in-button>
            </template>
            <span v-else-if="!distribution.length">暂无分配</span>
            <template v-else
              ><in-tag
                v-for="entry in distribution"
                :key="entry.revisionId"
                :value="{ text: `${roleVersionLabel(entry)} · ${entry.count} 条`, tag: 'info' }"
            /></template>
          </div>
          <div class="text-12px text-[var(--el-text-color-secondary)]">
            {{ detail.record.description || "暂无说明" }}
          </div>
        </div>
        <in-biz-tabs v-model="tab" align-content>
          <in-biz-tab-panel title="权限" name="grants" :editable="false" fill>
            <in-form-skeleton v-if="grantLoading" />
            <div v-else-if="grantError" class="p-20px">
              <el-alert title="权限加载失败" type="error" :closable="false" />
              <in-button @in-click="privateLoadGrants()">重试</in-button>
            </div>
            <div v-else class="grant-pane">
              <div class="grant-pane__toolbar">
                <div>拥有 {{ grants.length }} 个权限</div>
                <in-button
                  v-if="canPublish"
                  :loading="editingGrants"
                  :disabled="versioned && !latestRevision"
                  @in-click="privateEditGrants"
                >
                  <template #icon>
                    <svg
                      width="1em"
                      height="1em"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
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
          <in-biz-tab-panel
            v-if="versioned"
            title="版本历史"
            name="revisions"
            :editable="false"
            fill
          >
            <div v-if="revisionError" class="p-12px">
              <el-alert title="版本历史加载失败" type="error" :closable="false" />
              <in-button @in-click="privateLoadRevisionPage()">重试</in-button>
            </div>
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
                <template #revision="{ item }">{{
                  roleVersionLabel(asRevision(item).record)
                }}</template>
                <template #id="{ item }"
                  >{{ asRevision(item).record.id }}
                  <div class="text-12px">{{ asRevision(item).record.remark || "-" }}</div>
                  <div class="text-12px">
                    {{ formatDateTime(asRevision(item).record.publishedAt) }}
                  </div></template
                >
                <template #actions="{ item }">
                  <in-button
                    v-if="canPublish"
                    link
                    type="primary"
                    @in-click="privateEditRevision(asRevision(item).record)"
                    >基于此版本编辑</in-button
                  >
                  <in-button
                    v-if="canStatus"
                    link
                    @in-click="metadataDialog?.show(roleId, asRevision(item).record)"
                    >编辑版本信息</in-button
                  >
                  <in-button
                    v-if="applicationApi && canApply"
                    link
                    @in-click="applicationDrawer?.show(roleId, asRevision(item).record.id)"
                    >应用此版本</in-button
                  >
                </template>
                <template #deltas="{ item }">
                  <biz-iam-revision-delta-view
                    :items="displayDeltasOf(asRevision(item))"
                    :field-permissions="asRevision(item).record.resourceFieldPermissions"
                    :previous-field-permissions="
                      asRevision(item).record.previousResourceFieldPermissions
                    "
                    :action-names="revisionActionNames"
                    :revision="asRevision(item).record.revision"
                    :initial="isInitialRevision(asRevision(item))"
                  />
                </template>
              </in-table>
            </div>
          </in-biz-tab-panel>
          <in-biz-tab-panel
            v-if="versioned && applicationApi && canApply"
            title="应用任务"
            name="applications"
            :editable="false"
            fill
          >
            <div v-if="taskError" class="p-12px">
              <el-alert title="应用任务加载失败" type="error" :closable="false" />
              <in-button @in-click="privateTaskPage()">重试</in-button>
            </div>
            <div class="embedded-table">
              <in-table
                :loading="taskLoading"
                :data="taskPage.records || []"
                :page="taskPage"
                :headers="taskHeaders"
                density="compact"
                :row-key="(row: RoleApplicationTask) => row.id"
                @handleCurrentChange="privateTaskPage($event.value)"
                @handleSizeChange="privateTaskSize($event.value)"
              >
                <template #tools-start>
                  <in-button :loading="taskLoading" @in-click="privateTaskPage()">刷新</in-button>
                </template>
                <template #target="{ item }">{{
                  roleVersionLabel({
                    revision: asTask(item).targetRevisionNumber || "-",
                    versionName: asTask(item).targetVersionName,
                  })
                }}</template>
                <template #status="{ item }"
                  ><in-tag
                    :value="{
                      text: taskStatusLabel(asTask(item).status),
                      tag: asTask(item).status === 'SUCCEEDED' ? 'success' : 'info',
                    }"
                /></template>
                <template #progress="{ item }"
                  >成功 {{ asTask(item).counts.SUCCEEDED || 0 }}，待处理
                  {{ asTask(item).counts.PENDING || 0 }}，冲突
                  {{ asTask(item).counts.BLOCKED || 0 }}</template
                >
                <template #actions="{ item }"
                  ><in-button
                    link
                    type="primary"
                    @in-click="
                      applicationDrawer?.show(roleId, asTask(item).targetRevisionId, asTask(item))
                    "
                    >查看 / 继续处理</in-button
                  ></template
                >
              </in-table>
            </div>
          </in-biz-tab-panel>
        </in-biz-tabs>
      </div>
      <div v-else-if="detail" class="profile-form">
        <in-form>
          <el-form-item label="名称" required>
            <el-input
              v-model="profileDraft.name"
              placeholder="请输入名称"
              :disabled="!canEditProfile"
            />
          </el-form-item>
          <el-form-item label="分组">
            <el-input
              v-model="profileDraft.groupName"
              placeholder="请输入分组，可空"
              :disabled="!canEditProfile"
            />
          </el-form-item>
          <el-form-item label="状态">
            <in-select
              v-model="profileDraft.status"
              :options="statusOptions"
              placeholder="请选择状态"
            />
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
    :immediate="!versioned"
    :publish-api="versioned ? resolvedPublishApi : undefined"
    :domain="grantDomain"
    :application-api="versioned ? applicationApi : undefined"
    @prepared="privatePrepared"
    @success="privateOnGrantSaved"
  />
  <biz-iam-role-version-metadata-dialog
    ref="metadataDialog"
    :update-api="resolvedMetadataApi"
    @success="privateMetadataSaved"
  />
  <biz-iam-role-application-drawer
    v-if="applicationApi && canApply"
    ref="applicationDrawer"
    :api="applicationApi"
    :list-revisions-api="resolvedRevisionsApi"
    @success="privateOnApplicationsSaved"
  />
</template>

<script setup lang="ts">
import { formatDateTime } from "@ingot/shared";
import {
  Message,
  useCapabilities,
  createLoadGuard,
  isApiError,
  type Page,
  type R,
  type TableHeaderRecord,
} from "@ingot/admin-core";
import {
  AuthorizationDomain,
  BizIamRoleVersionMetadataDialog,
  BizIamRoleApplicationDrawer,
  roleVersionLabel,
  type RoleRevisionMetadataApi,
  type RoleApplicationApi,
  type RoleApplicationTask,
  BizIamRevisionDeltaView,
  BizIamStatusTag,
  ConfigurationStatus,
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
  PlatformSharedRoleRevisionMetadataAPI,
  PlatformSharedRoleRevisionDetailAPI,
  PlatformSharedRoleRevisionGrantsAPI,
  PlatformSharedRoleGrantsAPI,
  PlatformSharedRoleRevisionPageAPI,
  PlatformSharedRoleUpdateAPI,
} from "@/api/iam/authorization";
import { selectedGrantsOf } from "../actionCatalog";
import GrantEditWizard from "./GrantEditWizard.vue";
import GrantPreview from "./GrantPreview.vue";
import { useRoleDetailData } from "./useRoleDetailData";
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
    metadataApi?: RoleRevisionMetadataApi;
    revisionDetailApi?: (
      id: string,
      revisionId: string,
    ) => Promise<R<ResourceDetail<RoleRevision>>>;
    revisionGrantsApi?: (id: string, revisionId: string) => Promise<R<RoleGrantList>>;
    applicationApi?: RoleApplicationApi;
    statusAction?: string;
    publishAction?: string;
    versioned?: boolean;
  }>(),
  {
    grantDomain: AuthorizationDomain.TENANT,
    statusAction: IamAction.PLATFORM_SHARED_ROLE_STATUS,
    publishAction: IamAction.PLATFORM_SHARED_ROLE_UPDATE,
    versioned: true,
  },
);

const emits = defineEmits<{ success: [] }>();
const { hasAction } = useCapabilities();
const metadataDialog = ref<InstanceType<typeof BizIamRoleVersionMetadataDialog>>();
const applicationDrawer = ref<InstanceType<typeof BizIamRoleApplicationDrawer>>();
const resolvedMetadataApi = computed(
  () => props.metadataApi ?? PlatformSharedRoleRevisionMetadataAPI,
);
const taskHeaders: TableHeaderRecord[] = [
  { label: "应用版本", prop: "target", minWidth: 150 },
  { label: "状态", prop: "status", width: 100 },
  { label: "进度", prop: "progress", minWidth: 220 },
  { label: "操作", prop: "actions", width: 140 },
];
const asTask = (row: unknown) => row as RoleApplicationTask;
const taskStatusLabel = (state: RoleApplicationTask["status"]) =>
  ({
    PREPARING: "准备中",
    READY: "待确认",
    BLOCKED: "待处理",
    RUNNING: "执行中",
    PAUSED: "已暂停",
    SUCCEEDED: "已完成",
  })[state];
const privateTaskSize = (size: number): void => {
  taskPage.value.size = size;
  void privateTaskPage(1);
};
const privatePrepared = (task: RoleApplicationTask): void => {
  void applicationDrawer.value?.show(roleId.value, task.targetRevisionId, task);
};
const privateMetadataSaved = (): void => {
  refreshVersionMetadata();
};

const resolvedGetApi = computed(() => props.getApi ?? PlatformSharedRoleDetailAPI);
const resolvedGrantsApi = computed(() => props.listGrantsApi ?? PlatformSharedRoleGrantsAPI);
const resolvedRevisionsApi = computed(
  () => props.listRevisionsApi ?? PlatformSharedRoleRevisionPageAPI,
);
const resolvedPublishApi = computed(() => props.publishApi);
const canEditProfile = computed(() => Boolean(props.updateApi ?? !props.statusApi));
const visible = ref(false);
const tab = ref("grants");
const saving = ref(false);
const editingProfile = ref(false);
const {
  roleId,
  detail,
  canApply,
  grants,
  latestRevision,
  distribution,
  revisionPage,
  taskPage,
  loading,
  grantLoading,
  distributionLoading,
  revisionLoading,
  taskLoading,
  detailError,
  grantError,
  distributionError,
  revisionError,
  taskError,
  open,
  loadDetail: privateLoadDetail,
  loadGrants: privateLoadGrants,
  loadDistribution: privateLoadDistribution,
  loadRevisions: privateLoadRevisionPage,
  loadTasks: privateTaskPage,
  refreshVersionMetadata,
  refreshPublication,
  refreshApplications,
} = useRoleDetailData(
  {
    get: (id) => resolvedGetApi.value(id),
    grants: (id) => resolvedGrantsApi.value(id),
    revisions: (id, page) => resolvedRevisionsApi.value(id, page),
    applications: () => props.applicationApi,
    canGovern: () => hasAction(IamAction.PLATFORM_ASSIGNMENT_UPGRADE),
  },
  tab,
  visible,
);
const editingGrants = ref(false);
const editGuard = createLoadGuard();
watch(
  [roleId, visible],
  () => {
    editGuard.begin();
    editingGrants.value = false;
  },
  { flush: "sync" },
);
onScopeDispose(() => editGuard.begin());
const grantWizardRef = ref<{
  show: (input: {
    roleId: string;
    version: string;
    profile: { code: string; name: string; description: string; groupName: string };
    grants: SelectedGrant[];
    sourceRevision?: RoleRevision;
    latestRevisionId?: string;
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
const revisionHeaders: Array<TableHeaderRecord> = [
  { label: "版本", prop: "revision", minWidth: 160 },
  { label: "版本 ID", prop: "id", minWidth: 180 },
  { label: "差异", prop: "deltas", minWidth: 160 },
  { label: "操作", prop: "actions", minWidth: 160 },
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
const asRevision = (row: unknown): ResourceDetail<RoleRevision> =>
  row as ResourceDetail<RoleRevision>;
const displayDeltasOf = (row: ResourceDetail<RoleRevision>): RoleDelta[] =>
  row.record.displayDeltas ?? [];
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

watch(detail, fillProfile);

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
      void privateLoadDetail();
    })
    .finally(() => {
      saving.value = false;
    });
};

const privateEditRevision = async (revision: Pick<RoleRevision, "id">): Promise<void> => {
  const role = detail.value;
  if (!role) return;
  const id = roleId.value;
  const token = editGuard.begin();
  editingGrants.value = true;
  try {
    const [source, response] = await Promise.all([
      (props.revisionDetailApi ?? PlatformSharedRoleRevisionDetailAPI)(id, revision.id),
      (props.revisionGrantsApi ?? PlatformSharedRoleRevisionGrantsAPI)(id, revision.id),
    ]);
    if (!token.isCurrent()) return;
    grantWizardRef.value?.show({
      roleId: id,
      version: role.version,
      profile: {
        code: role.record.code,
        name: role.record.name,
        description: role.record.description ?? "",
        groupName: role.record.groupName ?? "",
      },
      grants: selectedGrantsOf(response.data.items),
      sourceRevision: source.data.record,
      latestRevisionId: latestRevision.value?.id,
    });
  } catch (error) {
    if (token.isCurrent() && !isApiError(error)) Message.error("角色版本加载失败，请重试");
  } finally {
    if (token.isCurrent()) editingGrants.value = false;
  }
};
const privateEditGrants = (): void => {
  if (!props.versioned) {
    const role = detail.value;
    if (!role) return;
    grantWizardRef.value?.show({
      roleId: roleId.value,
      version: role.version,
      profile: {
        code: role.record.code,
        name: role.record.name,
        description: role.record.description ?? "",
        groupName: role.record.groupName ?? "",
      },
      grants: JSON.parse(JSON.stringify(grants.value)),
    });
    return;
  }
  if (latestRevision.value) void privateEditRevision(latestRevision.value);
};

const privateOnGrantSaved = (): void => {
  emits("success");
  refreshPublication();
};

const privateOnApplicationsSaved = (): void => {
  emits("success");
  refreshApplications();
};

defineExpose<{ show: (id: string) => void }>({
  show(id: string) {
    editGuard.begin();
    editingGrants.value = false;
    visible.value = true;
    tab.value = "grants";
    editingProfile.value = false;
    open(id);
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
