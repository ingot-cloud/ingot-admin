<template>
  <in-drawer v-model="visible" title="角色详情" :loading="loading" size="720px">
    <in-biz-tabs v-model="tab">
      <in-biz-tab-panel title="基本资料" name="base">
      <el-form v-if="detail" label-position="top">
        <el-form-item label="编码">
          <span>{{ detail.record.code }}</span>
        </el-form-item>
        <el-form-item label="名称">
          <span>{{ detail.record.name }}</span>
        </el-form-item>
        <el-form-item label="来源">
          <span>{{ kindLabel(detail.record.kind) }}</span>
        </el-form-item>
        <el-form-item label="状态">
          <biz-iam-status-tag :status="detail.record.status" />
        </el-form-item>
        <el-form-item v-if="latest" label="当前版本">
          <span>{{ latest.record.revision }}</span>
        </el-form-item>
        <el-form-item v-if="latest?.record.deltas?.length" label="差异">
          <biz-iam-delta-tags :items="latest.record.deltas" />
        </el-form-item>
        <div class="flex flex-wrap gap-8px">
          <in-button
            v-if="statusApi && canStatus"
            @in-click="privateToggleStatus"
          >
            {{ detail.record.status === ConfigurationStatus.ENABLED ? "停用" : "启用" }}
          </in-button>
          <in-button v-if="deleteApi && canDelete" type="danger" @in-click="privateDelete">
            删除
          </in-button>
        </div>
      </el-form>
    </in-biz-tab-panel>
    <in-biz-tab-panel title="发布新版本" name="publish">
      <el-form label-position="top">
        <el-form-item label="定义">
          <biz-iam-grant-editor v-model="definition" :allow-deltas="allowDeltas" />
        </el-form-item>
        <biz-iam-preview-alert :preview="previewApi ? previewState.preview.value : null" />
        <div v-if="canPublish" class="flex flex-wrap gap-8px">
          <in-button v-if="allowDeltas" @in-click="privateRestoreDeltas">恢复平台设置</in-button>
          <in-button v-if="previewApi" :loading="previewState.loading.value" @in-click="privatePreview">
            预览
          </in-button>
          <in-button
            type="primary"
            :loading="saving"
            :disabled="previewApi ? !previewState.preview.value?.valid : false"
            @in-click="privatePublish"
          >
            发布（不自动升级授权）
          </in-button>
        </div>
      </el-form>
    </in-biz-tab-panel>
    <in-biz-tab-panel title="版本历史" name="revisions">
      <el-table :data="revisions" size="small">
        <el-table-column prop="record.revision" label="版本" width="80" />
        <el-table-column prop="record.id" label="版本 ID" />
        <el-table-column label="差异">
          <template #default="{ row }">
            <biz-iam-delta-tags :items="row.record.deltas" />
          </template>
        </el-table-column>
      </el-table>
    </in-biz-tab-panel>
    <in-biz-tab-panel v-if="showUpgrade" title="升级共享基础" name="upgrade">
      <el-form label-position="top">
        <el-form-item label="当前基础版本">
          <span>{{ latest?.record.baseRevisionId || "—" }}</span>
        </el-form-item>
        <el-form-item label="新基础版本 ID" required>
          <el-input v-model="newBaseRevisionId" placeholder="目标共享角色版本 ID" />
        </el-form-item>
        <el-alert
          type="info"
          :closable="false"
          title="默认不升级既有授权。发布共享新版本不会自动扩大本组织权限。"
        />
        <biz-iam-upgrade-conflicts
          v-model="resolutions"
          :conflicts="upgradeConflicts"
        />
        <div v-if="affectedAssignments.length" class="flex flex-col gap-8px">
          <div>受影响授权（默认全不选）</div>
          <el-checkbox-group v-model="selectedAssignmentIds">
            <el-checkbox v-for="id in affectedAssignments" :key="id" :label="id" :value="id">
              {{ id }}
            </el-checkbox>
          </el-checkbox-group>
        </div>
        <div
          v-if="upgradeImpact?.restricted"
          class="text-12px text-[var(--el-text-color-secondary)]"
        >
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
      </el-form>
    </in-biz-tab-panel>
    </in-biz-tabs>
  </in-drawer>
</template>

<script setup lang="ts">
import { Confirm, Message, isApiError, type Page, type R } from "@ingot/admin-core";
import { useIamDraftPreview } from "../hooks/useIamDraftPreview";
import {
  ConfigurationStatus,
  emptyRoleDefinitionDraft,
  objectActionAllowed,
  unresolvedUpgradeKeys,
  useRoleKindEnum,
  type ConfigurationStatusInput,
  type CreatedResource,
  type Preview,
  type ResourceDetail,
  type RoleDefinitionDraft,
  type RoleKind,
  type RolePublishInput,
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
const loading = ref(false);
const saving = ref(false);
const roleId = ref("");
const detail = ref<ResourceDetail<RoleSummary>>();
const revisions = ref<Array<ResourceDetail<RoleRevision>>>([]);
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

const latest = computed(() => {
  const items = [...revisions.value];
  items.sort((left, right) => Number(right.record.revision) - Number(left.record.revision));
  return items[0];
});
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
  () => !!props.upgradePreviewApi && !!props.upgradeApi && !!latest.value?.record.baseRevisionId,
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

const kindLabel = (kind: RoleKind): string => kindEnum.getTagText(kind).text;

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
};

const load = (id: string): void => {
  loading.value = true;
  Promise.all([
    props.getApi(id),
    props.listRevisionsApi(id, { current: 1, size: 50 }),
  ])
    .then(([role, page]) => {
      detail.value = role.data;
      revisions.value = page.data.records ?? [];
      applyRevision(latest.value);
    })
    .finally(() => {
      loading.value = false;
    });
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

const privatePublish = (): void => {
  if (!detail.value) {
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

const privateToggleStatus = (): void => {
  if (!detail.value || !props.statusApi) {
    return;
  }
  const next =
    detail.value.record.status === ConfigurationStatus.ENABLED
      ? ConfigurationStatus.DISABLED
      : ConfigurationStatus.ENABLED;
  Confirm.warning(`是否${next === ConfigurationStatus.DISABLED ? "停用" : "启用"}角色（${detail.value.record.name}）？`).then(
    () => {
      props.statusApi?.(roleId.value, {
        expectedVersion: detail.value!.version,
        status: next,
      }).then(() => {
        Message.success("状态已更新");
        emits("success");
        load(roleId.value);
      });
    },
  );
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

defineExpose({
  show(id: string) {
    roleId.value = id;
    visible.value = true;
    tab.value = "base";
    newBaseRevisionId.value = "";
    resolutions.value = [];
    selectedAssignmentIds.value = [];
    previewState.bumpDraft();
    upgradePreviewState.bumpDraft();
    load(id);
  },
});
</script>
