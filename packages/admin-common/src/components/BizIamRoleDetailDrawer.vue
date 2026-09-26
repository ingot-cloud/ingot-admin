<template>
  <in-detail-drawer
    v-model="visible"
    v-model:tab="tab"
    v-model:editing="editing"
    title="角色详情"
    :loading="loading"
    :saving="saving"
    size="720px"
    @cancel="privateOnCancel"
    @save="privateOnSave"
  >
    <in-biz-tab-panel title="基本资料" name="base" :editable="canStatus">
      <div v-if="detail" class="flex flex-col gap-12px">
        <in-form :editing="editing">
          <in-detail-field label="编码" :value="detail.record.code || '-'" />
          <in-detail-field label="名称" :value="detail.record.name || '-'" />
          <in-detail-field label="来源" :value="kindLabel(detail.record.kind)" />
          <in-detail-field label="状态">
            <template #view>
              <biz-iam-status-tag v-if="knownStatus(detail.record.status)" :status="detail.record.status" />
              <span v-else>-</span>
            </template>
            <in-select v-model="statusDraft" :options="statusOptions" placeholder="请选择状态" />
          </in-detail-field>
          <in-detail-field label="当前版本" :value="latestRevision?.record.revision || '-'" />
          <in-detail-field label="操作授权">
            <template #view>
              <div v-if="grantLines.length" class="flex flex-col gap-4px">
                <div v-for="(line, index) in grantLines" :key="index">{{ line }}</div>
              </div>
              <span v-else>-</span>
            </template>
          </in-detail-field>
          <in-detail-field label="差异">
            <template #view>
              <biz-iam-revision-delta-view
                v-if="latestRevision"
                :items="displayDeltasOf(latestRevision)"
                :action-names="revisionActionNames"
                :revision="latestRevision.record.revision"
                :initial="isInitialRevision(latestRevision)"
              />
              <span v-else>-</span>
            </template>
          </in-detail-field>
        </in-form>
        <div v-if="deleteApi && canDelete">
          <in-button type="danger" @in-click="privateDelete">删除</in-button>
        </div>
      </div>
    </in-biz-tab-panel>
    <in-biz-tab-panel title="发布新版本" name="publish" :editable="false">
      <div class="flex flex-col gap-12px">
        <in-form :editing="true">
          <in-detail-field label="操作授权">
            <div class="mb-8px text-12px text-[var(--el-text-color-secondary)]">
              <template v-if="loadApplications && loadActions">先选择应用，再选择操作。</template>
              内容没有改动时，预览通过也不会打开发布。
            </div>
            <biz-iam-grant-editor
              v-model="definition"
              :allow-deltas="allowDeltas"
              :load-applications="loadApplications"
              :load-actions="loadActions"
              :initial-application-ids="grantApplicationIds"
              :application-names="applicationNames"
              :action-names="actionNames"
            />
          </in-detail-field>
        </in-form>
        <biz-iam-preview-alert :preview="previewApi ? previewState.preview.value : null" />
        <div v-if="canPublish" class="flex flex-wrap gap-8px">
          <in-button v-if="allowDeltas" @in-click="privateRestoreDeltas">恢复平台设置</in-button>
          <in-button v-if="previewApi" :loading="previewState.loading.value" @in-click="privatePreview">
            预览
          </in-button>
          <in-button type="primary" :loading="saving" :disabled="!canRelease" @in-click="privatePublish">
            发布（不自动升级授权）
          </in-button>
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
    <in-biz-tab-panel v-if="showUpgrade" title="升级共享基础" name="upgrade" :editable="false">
      <div class="flex flex-col gap-12px">
        <in-form :editing="true">
          <in-detail-field label="当前基础版本" :value="latestRevision?.record.baseRevisionId" />
          <in-detail-field label="新基础版本 ID" required>
            <el-input v-model="newBaseRevisionId" clearable placeholder="请输入新基础版本 ID" />
          </in-detail-field>
        </in-form>
        <el-alert
          type="info"
          :closable="false"
          title="默认不升级既有授权。发布共享新版本不会自动扩大本组织权限。"
        />
        <biz-iam-upgrade-conflicts v-model="resolutions" :conflicts="upgradeConflicts" />
        <div v-if="affectedAssignments.length" class="flex flex-col gap-8px">
          <div>受影响授权（默认全不选）</div>
          <el-checkbox-group v-model="selectedAssignmentIds">
            <el-checkbox v-for="id in affectedAssignments" :key="id" :label="id" :value="id">
              {{ id }}
            </el-checkbox>
          </el-checkbox-group>
        </div>
        <div v-if="upgradeImpact?.restricted" class="text-12px text-[var(--el-text-color-secondary)]">
          部分影响当前身份无法披露，不以 0 代替
        </div>
        <biz-iam-preview-alert :preview="upgradePreviewState.preview.value" />
        <div v-if="canUpgrade" class="flex flex-wrap gap-8px">
          <in-button :loading="upgradePreviewState.loading.value" @in-click="privateUpgradePreview">
            预览三方差异
          </in-button>
          <in-button
            type="primary"
            :loading="upgrading"
            :disabled="!canSubmitUpgrade"
            @in-click="privateUpgrade"
          >
            提交升级
          </in-button>
        </div>
      </div>
    </in-biz-tab-panel>
  </in-detail-drawer>
</template>

<script setup lang="ts">
import {
  Confirm,
  Message,
  createLoadGuard,
  isApiError,
  type LoadDataParams,
  type Page,
  type R,
  type TableHeaderRecord,
} from "@ingot/admin-core";
import { useIamDraftPreview } from "../hooks/useIamDraftPreview";
import BizIamGrantEditor from "./BizIamGrantEditor.vue";
import BizIamRevisionDeltaView from "./BizIamRevisionDeltaView.vue";
import BizIamPreviewAlert from "./BizIamPreviewAlert.vue";
import BizIamStatusTag from "./BizIamStatusTag.vue";
import BizIamUpgradeConflicts from "./BizIamUpgradeConflicts.vue";
import {
  ConfigurationStatus,
  IAM_DEFAULT_PAGE_SIZE,
  emptyRoleDefinitionDraft,
  formatScopeKinds,
  objectActionAllowed,
  revisionDisplayDeltas,
  unresolvedUpgradeKeys,
  useConfigurationStatusEnum,
  useRoleKindEnum,
  type IamActionRef,
  type IamSelectOption,
  type ConfigurationStatusInput,
  type CreatedResource,
  type Preview,
  type ResourceDetail,
  type RoleDefinitionDraft,
  type RoleKind,
  type RolePublishInput,
  type RoleDelta,
  type RoleRevision,
  type RoleSummary,
  type UpgradeInput,
  type UpgradePreview,
  type UpgradePreviewInput,
  type UpgradeResolution,
} from "../models/iam";

defineOptions({ name: "BizIamRoleDetailDrawer" });

const props = defineProps<{
  allowDeltas?: boolean;
  loadApplications?: (params: LoadDataParams) => Promise<Page<IamSelectOption>>;
  loadActions?: (applicationId: string, params: LoadDataParams) => Promise<Page<IamSelectOption>>;
  resolveActions?: (ids: string[]) => Promise<IamActionRef[]>;
  getApi: (id: string) => Promise<R<ResourceDetail<RoleSummary>>>;
  listRevisionsApi: (id: string, page: Page) => Promise<R<Page<ResourceDetail<RoleRevision>>>>;
  previewApi?: (id: string, draft: RoleDefinitionDraft) => Promise<R<Preview>>;
  publishApi: (id: string, input: RolePublishInput) => Promise<R<CreatedResource>>;
  statusApi?: (id: string, input: ConfigurationStatusInput) => Promise<R<CreatedResource>>;
  deleteApi?: (id: string) => Promise<R<CreatedResource>>;
  upgradePreviewApi?: (id: string, input: UpgradePreviewInput) => Promise<R<Preview<UpgradePreview>>>;
  upgradeApi?: (id: string, input: UpgradeInput) => Promise<R<CreatedResource>>;
  publishAction: string;
  statusAction?: string;
  deleteAction?: string;
  upgradeAction?: string;
}>();

const emits = defineEmits<{ success: [] }>();
const visible = ref(false);
const tab = ref("base");
const editing = ref(false);
const loading = ref(false);
const saving = ref(false);
const statusEnum = useConfigurationStatusEnum();
const statusOptions = statusEnum.getOptions();
const statusDraft = ref<ConfigurationStatus>(ConfigurationStatus.ENABLED);
const baselineDefinition = ref("");
const actionRefs = ref<Record<string, IamActionRef>>({});
const revisionLoading = ref(false);
const revisionsHydrated = ref(false);
const loadGuard = createLoadGuard();
const revisionGuard = createLoadGuard();
const roleId = ref("");
const detail = ref<ResourceDetail<RoleSummary>>();
const revisionPage = ref<Page<ResourceDetail<RoleRevision>>>({
  current: 1,
  size: IAM_DEFAULT_PAGE_SIZE,
  total: 0,
  records: [],
});
const latestRevision = ref<ResourceDetail<RoleRevision>>();
const revisionDeltas = ref<Record<string, RoleDelta[]>>({});
const revisionActionNames = ref<Record<string, string>>({});
const revisionHeaders: Array<TableHeaderRecord> = [
  { label: "版本", prop: "revision", width: 80 },
  { label: "版本 ID", prop: "id", minWidth: 180 },
  { label: "差异", prop: "deltas", minWidth: 160 },
];
const definition = ref<RoleDefinitionDraft>(emptyRoleDefinitionDraft());
const kindEnum = useRoleKindEnum();
const contextEpoch = computed(() => detail.value?.version ?? "0");
const newBaseRevisionId = ref("");
const resolutions = ref<UpgradeResolution[]>([]);
const selectedAssignmentIds = ref<string[]>([]);
const upgrading = ref(false);
const previewState = useIamDraftPreview<RoleDefinitionDraft>({
  contextEpoch,
  preview: async (draft) => {
    if (!props.previewApi) {
      return { version: contextEpoch.value, valid: true, errors: [], warnings: [] };
    }
    const response = await props.previewApi(roleId.value, draft);
    return response.data;
  },
});

watch(definition, () => previewState.bumpDraft(), { deep: true });

const upgradeDraft = computed<UpgradePreviewInput>(() => ({
  newBaseRevisionId: newBaseRevisionId.value.trim(),
  resolutions: resolutions.value,
}));
const upgradePreviewState = useIamDraftPreview<UpgradePreviewInput, UpgradePreview>({
  contextEpoch,
  preview: async (draft) => {
    if (!props.upgradePreviewApi) {
      return { version: contextEpoch.value, valid: true, errors: [], warnings: [] };
    }
    const response = await props.upgradePreviewApi(roleId.value, draft);
    return response.data;
  },
});
watch(upgradeDraft, () => upgradePreviewState.bumpDraft(), { deep: true });

const revisionKeyOf = (row: ResourceDetail<RoleRevision>): string => row.record.id;
const asRevision = (row: unknown): ResourceDetail<RoleRevision> =>
  row as ResourceDetail<RoleRevision>;
const displayDeltasOf = (row: ResourceDetail<RoleRevision>): RoleDelta[] =>
  revisionDeltas.value[row.record.id] ?? [];
const isInitialRevision = (row: ResourceDetail<RoleRevision>): boolean =>
  Number(row.record.revision) === 1 && Boolean(row.record.grants?.length);

const applyRevisionDiffs = (
  records: ResourceDetail<RoleRevision>[],
  older?: RoleRevision,
): RoleDelta[] => {
  const next: Record<string, RoleDelta[]> = {};
  const deltas: RoleDelta[] = [];
  records.forEach((item, index) => {
    const previous = records[index + 1]?.record ?? (index === records.length - 1 ? older : undefined);
    const items = revisionDisplayDeltas(item.record, previous);
    next[item.record.id] = items;
    deltas.push(...items);
  });
  revisionDeltas.value = next;
  return deltas;
};

const resolveRevisionNames = (deltas: RoleDelta[]): void => {
  const ids = [...new Set(deltas.map((item) => item.actionId).filter(Boolean))];
  if (!ids.length || !props.resolveActions) {
    return;
  }
  void props.resolveActions(ids).then((items) => {
    revisionActionNames.value = {
      ...revisionActionNames.value,
      ...Object.fromEntries(items.map((item) => [item.id, item.name])),
    };
  });
};

const hydrateRevisionDiffs = async (): Promise<void> => {
  const records = revisionPage.value.records ?? [];
  const last = records.at(-1);
  const current = revisionPage.value.current ?? 1;
  const size = revisionPage.value.size ?? IAM_DEFAULT_PAGE_SIZE;
  const total = revisionPage.value.total ?? 0;
  let older: RoleRevision | undefined;
  if (last && Number(last.record.revision) > 1 && current * size < total) {
    const next = await props.listRevisionsApi(roleId.value, { current: current + 1, size });
    older = next.data.records?.[0]?.record;
  }
  resolveRevisionNames(applyRevisionDiffs(records, older));
};
const canStatus = computed(
  () =>
    !!props.statusAction &&
    objectActionAllowed(detail.value?.capabilities, props.statusAction).allowed,
);
const canDelete = computed(
  () =>
    !!props.deleteAction &&
    objectActionAllowed(detail.value?.capabilities, props.deleteAction).allowed,
);
const canPublish = computed(
  () => objectActionAllowed(detail.value?.capabilities, props.publishAction).allowed,
);
const showUpgrade = computed(
  () => !!props.upgradePreviewApi && !!props.upgradeApi && !!latestRevision.value?.record.baseRevisionId,
);
const canUpgrade = computed(
  () =>
    showUpgrade.value &&
    !!props.upgradeAction &&
    objectActionAllowed(detail.value?.capabilities, props.upgradeAction).allowed,
);
const upgradeConflicts = computed(
  () => upgradePreviewState.preview.value?.effectiveResult?.conflicts ?? [],
);
const affectedAssignments = computed(
  () => upgradePreviewState.preview.value?.effectiveResult?.affectedAssignments ?? [],
);
const upgradeImpact = computed(
  () => upgradePreviewState.preview.value?.effectiveResult?.impactSummary,
);
const canSubmitUpgrade = computed(() => {
  const preview = upgradePreviewState.preview.value;
  if (!preview?.valid || !newBaseRevisionId.value.trim()) {
    return false;
  }
  return unresolvedUpgradeKeys(upgradeConflicts.value, resolutions.value).length === 0;
});

const kindLabel = (kind?: RoleKind): string => {
  if (!kind) {
    return "-";
  }
  const text = kindEnum.getTagText(kind, { text: "", tag: "info" }).text;
  return text || "-";
};

const knownStatus = (status?: ConfigurationStatus): status is ConfigurationStatus =>
  status === ConfigurationStatus.ENABLED || status === ConfigurationStatus.DISABLED;

const definitionKey = (draft: RoleDefinitionDraft): string =>
  JSON.stringify({
    grants: draft.grants.map((item) => ({
      actionId: item.actionId.trim(),
      scopes: item.scopes ?? [],
    })),
    deltas: draft.deltas.map((item) => ({
      actionId: item.actionId.trim(),
      operation: item.operation,
      scopes: item.scopes ?? [],
    })),
    parameterDefinitions: draft.parameterDefinitions.map((item) => ({
      key: item.key.trim(),
      kind: item.kind,
    })),
    metadataOverrides: draft.metadataOverrides ?? null,
  });

const definitionChanged = computed(() => definitionKey(definition.value) !== baselineDefinition.value);
const grantApplicationIds = computed(() =>
  (latestRevision.value?.record.grants ?? []).map(
    (grant) => actionRefs.value[grant.actionId]?.applicationId ?? "",
  ),
);
const applicationNames = computed(() =>
  Object.fromEntries(Object.values(actionRefs.value).map((item) => [item.applicationId, item.applicationName])),
);
const actionNames = computed(() =>
  Object.fromEntries(Object.values(actionRefs.value).map((item) => [item.id, item.name])),
);
const grantLines = computed(() =>
  (latestRevision.value?.record.grants ?? []).map((grant) => {
    const scopes = formatScopeKinds((grant.scopes ?? []).map((item) => item.kind));
    const action = actionRefs.value[grant.actionId];
    const title = action
      ? `${action.applicationName} / ${action.name}`
      : grant.actionId
        ? `未知操作（${grant.actionId}）`
        : "-";
    return `${title} · ${scopes}`;
  }),
);
const canRelease = computed(() => {
  if (!definitionChanged.value) {
    return false;
  }
  if (props.previewApi && !previewState.preview.value?.valid) {
    return false;
  }
  return true;
});

const applyRevision = (revision: ResourceDetail<RoleRevision> | undefined): void => {
  definition.value = revision
    ? {
        grants: revision.record.grants.map((item) => ({
          actionId: item.actionId,
          scopes: [...item.scopes],
        })),
        deltas: revision.record.deltas.map((item) => ({
          actionId: item.actionId,
          operation: item.operation,
          scopes: item.scopes ? [...item.scopes] : undefined,
        })),
        parameterDefinitions: [...revision.record.parameterDefinitions],
        metadataOverrides: revision.record.metadataOverrides,
      }
    : emptyRoleDefinitionDraft();
  baselineDefinition.value = definitionKey(definition.value);
};

const assignRevisionPage = (
  page: Page<ResourceDetail<RoleRevision>>,
  updateDraft: boolean,
): void => {
  const records = page.records ?? [];
  revisionPage.value = {
    current: page.current ?? 1,
    size: page.size ?? revisionPage.value.size ?? IAM_DEFAULT_PAGE_SIZE,
    total: page.total ?? 0,
    records,
  };
  if ((revisionPage.value.current ?? 1) === 1) {
    latestRevision.value = records[0];
    if (updateDraft) {
      applyRevision(latestRevision.value);
    }
  }
};

const resolveLatestGrantNames = (guard: { isCurrent: () => boolean }): Promise<void> => {
  const ids = (latestRevision.value?.record.grants ?? []).map((item) => item.actionId).filter(Boolean);
  if (!props.resolveActions || !ids.length) {
    return Promise.resolve();
  }
  return props.resolveActions(ids).then((items) => {
    if (!guard.isCurrent()) {
      return;
    }
    actionRefs.value = Object.fromEntries(items.map((item) => [item.id, item]));
  });
};

const load = (id: string): void => {
  const guard = loadGuard.begin();
  const revisionsGuard = revisionGuard.begin();
  const size = revisionPage.value.size ?? IAM_DEFAULT_PAGE_SIZE;
  loading.value = true;
  revisionLoading.value = true;
  revisionsHydrated.value = false;
  detail.value = undefined;
  latestRevision.value = undefined;
  actionRefs.value = {};
  revisionDeltas.value = {};
  revisionActionNames.value = {};
  revisionPage.value = { current: 1, size, total: 0, records: [] };
  definition.value = emptyRoleDefinitionDraft();
  props
    .getApi(id)
    .then((role) => {
      if (!guard.isCurrent()) {
        return;
      }
      detail.value = role.data;
      statusDraft.value = knownStatus(role.data.record.status)
        ? role.data.record.status
        : ConfigurationStatus.ENABLED;
      return props.listRevisionsApi(id, { current: 1, size });
    })
    .then((page) => {
      if (!page || !guard.isCurrent() || !revisionsGuard.isCurrent()) {
        return;
      }
      assignRevisionPage(page.data, true);
      applyRevisionDiffs(page.data.records ?? []);
      return resolveLatestGrantNames(guard);
    })
    .finally(() => {
      if (guard.isCurrent()) {
        loading.value = false;
        revisionLoading.value = false;
      }
    });
};

watch(tab, (name) => {
  if (name === "revisions" && latestRevision.value && !revisionsHydrated.value) {
    revisionsHydrated.value = true;
    void hydrateRevisionDiffs();
  }
});

const privateLoadRevisionPage = (): void => {
  const id = roleId.value;
  if (!id) {
    return;
  }
  const guard = revisionGuard.begin();
  revisionLoading.value = true;
  props
    .listRevisionsApi(id, {
      current: revisionPage.value.current ?? 1,
      size: revisionPage.value.size ?? IAM_DEFAULT_PAGE_SIZE,
    })
    .then((page) => {
      if (!guard.isCurrent()) {
        return;
      }
      assignRevisionPage(page.data, false);
      return hydrateRevisionDiffs();
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

const privatePreview = (): void => {
  void previewState.runPreview(definition.value);
};

const privateRestoreDeltas = (): void => {
  definition.value = {
    ...definition.value,
    deltas: [],
  };
  previewState.bumpDraft();
};

const privateOnCancel = (): void => {
  const status = detail.value?.record.status;
  statusDraft.value = knownStatus(status) ? status : ConfigurationStatus.ENABLED;
};

const privateOnSave = (): void => {
  if (!detail.value || !props.statusApi) {
    editing.value = false;
    return;
  }
  if (!knownStatus(statusDraft.value) || statusDraft.value === detail.value.record.status) {
    editing.value = false;
    return;
  }
  saving.value = true;
  props
    .statusApi(roleId.value, {
      expectedVersion: detail.value.version,
      status: statusDraft.value,
    })
    .then(() => {
      Message.success("状态已更新");
      editing.value = false;
      emits("success");
      load(roleId.value);
    })
    .finally(() => {
      saving.value = false;
    });
};

const privatePublish = (): void => {
  if (!detail.value) {
    return;
  }
  if (!definitionChanged.value) {
    Message.warning("操作授权没有变化，无需发布");
    return;
  }
  if (props.previewApi && !previewState.preview.value?.valid) {
    Message.warning("请先预览且预览通过后再发布");
    return;
  }
  saving.value = true;
  props
    .publishApi(roleId.value, {
      expectedVersion: detail.value.version,
      definition: definition.value,
    })
    .then(() => {
      Message.success("已发布新版本，既有授权仍钉在旧版本");
      emits("success");
      load(roleId.value);
    })
    .finally(() => {
      saving.value = false;
    });
};

const privateDelete = (): void => {
  if (!detail.value || !props.deleteApi) {
    return;
  }
  Confirm.error(`未引用角色才会删除。是否删除（${detail.value.record.name}）？`, {
    confirmButtonText: "删除",
  }).then(() => {
    props.deleteApi?.(roleId.value).then(() => {
      Message.success("已删除");
      visible.value = false;
      emits("success");
    });
  });
};

const privateUpgradePreview = (): void => {
  if (!newBaseRevisionId.value.trim()) {
    Message.warning("请填写新基础版本 ID");
    return;
  }
  void upgradePreviewState.runPreview(upgradeDraft.value);
};

const privateUpgrade = (): void => {
  if (!detail.value || !props.upgradeApi) {
    return;
  }
  if (!canSubmitUpgrade.value) {
    Message.warning("请先预览、逐项解决冲突后再提交；默认不会改写既有授权");
    return;
  }
  upgrading.value = true;
  props
    .upgradeApi(roleId.value, {
      expectedVersion: upgradePreviewState.preview.value?.version ?? detail.value.version,
      newBaseRevisionId: newBaseRevisionId.value.trim(),
      resolutions: resolutions.value,
      assignmentIds: selectedAssignmentIds.value,
    })
    .then(() => {
      Message.success("已升级共享基础；未勾选的授权仍钉在旧版本");
      emits("success");
      selectedAssignmentIds.value = [];
      load(roleId.value);
    })
    .catch((error: unknown) => {
      if (isApiError(error) && error.status === 409) {
        Message.warning("版本冲突，已保留处置草稿，请重新预览后再提交");
        void upgradePreviewState.runPreview(upgradeDraft.value);
      }
    })
    .finally(() => {
      upgrading.value = false;
    });
};

defineExpose<{ show: (id: string) => void }>({
  show(id: string) {
    roleId.value = id;
    visible.value = true;
    tab.value = "base";
    editing.value = false;
    newBaseRevisionId.value = "";
    resolutions.value = [];
    selectedAssignmentIds.value = [];
    previewState.bumpDraft();
    upgradePreviewState.bumpDraft();
    load(id);
  },
});
</script>

<style lang="postcss" scoped>
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
