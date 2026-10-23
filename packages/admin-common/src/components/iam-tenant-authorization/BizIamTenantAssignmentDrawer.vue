<template>
  <in-drawer
    v-model="visible"
    :title="editing ? '调整角色分配' : '分配角色'"
    :loading="loading"
    size="100%"
    layout="pinned"
    padding="0"
    close-position="start"
    :before-close="privateBeforeClose"
  >
    <div v-if="visible" class="in-wizard-frame flex h-full min-h-0">
      <biz-iam-wizard-nav :steps="wizardSteps" :current="step" />
      <section class="flex-1 min-w-0 min-h-0 flex flex-col px-48px py-24px">
        <div class="mb-24px text-18px shrink-0">{{ wizardSteps[step].title }}</div>
        <div class="flex-1 min-h-0 overflow-auto">
          <in-form v-if="step === 0" label-position="top" class="max-w-720px">
            <el-form-item label="授权依据" :required="!editing && !canAssignDirectly">
              <div v-if="editing">{{ basisLabel }}</div>
              <div v-else-if="!sources.length" class="flex flex-col gap-4px">
                <span>直接分配</span>
                <span class="text-12px text-[var(--el-text-color-secondary)]">
                  你拥有直接分配资格，无需绑定委派。
                </span>
              </div>
              <el-select
                v-else
                v-model="sourceId"
                class="w-full"
                :disabled="loading || saving"
                placeholder="请选择授权委派"
              >
                <el-option v-if="canAssignDirectly" label="直接分配" value="" />
                <el-option
                  v-for="source in sources"
                  :key="source.id"
                  :value="source.id"
                  :label="sourceLabel(source)"
                />
              </el-select>
              <div
                v-if="!editing && selectedSource"
                class="mt-8px text-[var(--el-text-color-secondary)]"
              >
                可分配角色：{{ selectedSource.allowedRoles.map((role) => role.name).join("、")
                }}<br />
                接收人群：{{ selectedSource.recipientSummary }}；单次最长
                {{ formatDuration(selectedSource.maxAssignmentDuration) }}<br />
                有效期：{{ formatDateTime(selectedSource.validFrom, { fallback: "立即" }) }} 至
                {{ formatDateTime(selectedSource.validUntil, { fallback: "长期" }) }}
              </div>
              <span
                v-if="!editing && sources.length"
                class="mt-4px text-12px text-[var(--el-text-color-secondary)]"
              >
                依据你持有的授权委派进行分配，可选角色、接收对象和范围受该委派限制；切换后会清空接收对象和角色。
              </span>
            </el-form-item>
            <el-form-item label="接收对象" required>
              <div v-if="editing">
                {{ editing.record.subjectName || editing.record.assignment.subject.id }}
              </div>
              <div v-else class="w-full flex flex-col gap-12px">
                <div class="flex flex-col gap-4px">
                  <span class="text-12px text-[var(--el-text-color-secondary)]">成员</span>
                  <biz-iam-delegation-candidate-picker
                    :model-value="members.map((item) => item.id)"
                    :api="optionsAPI"
                    :query="{ kind: 'MEMBER' }"
                    :load-member-browse="loadMemberBrowse"
                    :selected-options="members"
                    :reset-key="selectionKey"
                    :disabled="!ready || saving"
                    multiple
                    title="选择成员"
                    placeholder="请选择成员"
                    search-placeholder="搜索成员"
                    @confirm="members = privateOptions($event)"
                  />
                </div>
                <div class="flex flex-col gap-4px">
                  <span class="text-12px text-[var(--el-text-color-secondary)]">用户组</span>
                  <biz-iam-delegation-candidate-picker
                    :model-value="groups.map((item) => item.id)"
                    :api="optionsAPI"
                    :query="{ kind: 'GROUP' }"
                    :selected-options="groups"
                    :reset-key="selectionKey"
                    :disabled="!ready || saving"
                    multiple
                    title="选择用户组"
                    placeholder="请选择用户组"
                    search-placeholder="搜索用户组"
                    @confirm="groups = privateOptions($event)"
                  />
                </div>
                <span class="text-12px text-[var(--el-text-color-secondary)]">
                  成员和用户组可同时选择，所选角色会分配给每个接收对象。
                </span>
              </div>
            </el-form-item>
          </in-form>
          <in-form v-else-if="step === 1" label-position="top" class="max-w-720px">
            <el-form-item label="角色" required>
              <div v-if="editing">
                {{ editing.record.roleName || editing.record.assignment.roleId }}
              </div>
              <biz-iam-delegation-candidate-picker
                v-else
                :model-value="roles.map((draft) => draft.role.id)"
                :api="optionsAPI"
                :query="{ kind: 'ROLE' }"
                :selected-options="roles.map((draft) => draft.role)"
                :reset-key="selectionKey"
                :disabled="!ready || saving"
                multiple
                title="选择角色"
                placeholder="请选择角色"
                search-placeholder="搜索角色名称"
                @confirm="privateRoles"
              />
              <span class="mt-4px text-12px text-[var(--el-text-color-secondary)]">
                所选角色分配给所有接收对象；角色权限调整后，已分配的成员自动生效。
              </span>
              <div v-if="pendingRoles.length" class="mt-8px">
                <span class="text-12px text-[var(--el-color-warning)]">
                  {{
                    pendingRoles.map((draft) => draft.role.name).join("、")
                  }}
                  的角色资料未加载，无法配置范围。
                </span>
                <in-button link type="primary" @in-click="privateLoadDefinitions(pendingRoles)">
                  重新加载
                </in-button>
              </div>
            </el-form-item>
            <el-form-item label="生效时间与失效时间">
              <biz-iam-duration-fields
                v-model:valid-from="validFrom"
                v-model:valid-until="validUntil"
              />
              <span class="mt-4px text-12px text-[var(--el-text-color-secondary)]">
                所选角色共用有效期；留空表示立即生效、长期有效。使用委派时须设置失效时间，并符合来源期限与单次最长时长。
              </span>
            </el-form-item>
            <el-alert
              v-if="validityIssue"
              :title="validityIssue"
              type="warning"
              :closable="false"
            />
          </in-form>
          <div v-else-if="step === 2" class="max-w-720px mb-24px">
            <biz-iam-tenant-assignment-scope-step
              ref="scopeStep"
              v-model:roles="roles"
              :api-for="scopeApiFor"
              :reset-key="selectionKey"
              :disabled="saving"
            />
          </div>
          <div v-else class="max-w-720px flex flex-col gap-16px">
            <div>授权依据：{{ basisLabel }}</div>
            <div>
              接收对象：{{
                editing?.record.subjectName ||
                [...members, ...groups].map((item) => item.name).join("、")
              }}
            </div>
            <div>角色：{{ roles.map((draft) => draft.role.name).join("、") }}</div>
            <div>本次共 {{ draft.items.length }} 条分配</div>
            <div>
              有效期：{{ formatDateTime(validFrom, { fallback: "立即" }) }} 至
              {{ formatDateTime(validUntil, { fallback: "长期" }) }}
            </div>
            <biz-iam-preview-alert :preview="previewState.preview.value" />
            <div
              v-for="(item, index) in previewState.preview.value?.effectiveResult?.items || []"
              :key="index"
              class="rounded-4px p-16px bg-[var(--in-permission-panel-bg)] flex flex-col gap-8px"
            >
              <div>{{ previewItemLabel(index) }} · {{ item.allowed ? "可分配" : "不可分配" }}</div>
              <div class="text-12px text-[var(--el-text-color-secondary)]">
                {{ previewScopeLabel(index) }}
              </div>
              <div
                v-for="(issue, issueIndex) in item.errors"
                :key="issueIndex"
                class="text-12px text-[var(--el-color-warning)]"
              >
                {{ issue.message }}
              </div>
            </div>
            <el-alert
              v-if="staleVersion"
              type="warning"
              :closable="false"
              title="分配已被他人修改，当前输入暂留在抽屉中；重新打开会载入最新内容。"
            />
          </div>
        </div>
      </section>
    </div>
    <template #footer>
      <in-button @click="privateBeforeClose(() => (visible = false))">取消</in-button>
      <in-button v-if="step > 0" @in-click="step -= 1">上一步</in-button>
      <in-button v-if="step < 3" type="primary" :disabled="!canAdvance" @in-click="privateNext">
        下一步
      </in-button>
      <in-button
        v-if="step === 3"
        :loading="previewState.loading.value"
        :disabled="saving || !ready || staleVersion || unavailable"
        @in-click="runPreview"
        >预览效果</in-button
      >
      <in-button
        v-if="step === 3 && previewState.preview.value?.valid === true"
        type="primary"
        :loading="saving"
        :disabled="!canSubmit"
        @in-click="submit"
        >{{ editing ? "保存" : "分配角色" }}</in-button
      >
    </template>
  </in-drawer>
</template>
<script setup lang="ts">
import { computed, inject, ref, watch } from "vue";
import { formatDateTime } from "@ingot/shared";
import {
  confirmUnsavedChanges,
  isApiError,
  Message,
  refreshSessionPermissions,
  useCapabilities,
} from "@ingot/admin-core";
import {
  organizationMemberPickerKey,
  OrganizationMemberScene,
  type OrganizationMemberBrowseLoader,
} from "../organizationMemberPicker";
import {
  formatDuration,
  IamAction,
  SubjectType,
  type AssignmentPreviewResult,
  type AuthorizationCandidatesApi,
  type IamSelectOption,
  type ResourceDetail,
  type TenantAssignmentApis,
  type TenantAssignmentInput,
  type TenantAssignmentRecord,
  type TenantDelegationMine,
} from "../../models/iam";
import {
  applyTenantRoleDefinition,
  reconcileTenantAssignmentRoles,
  tenantAssignmentBatch,
  tenantAssignmentScopeIssues,
  tenantAssignmentValidityIssue,
  type TenantAssignmentRoleDraft,
} from "../../models/iam/tenantAssignment";
import { useIamDraftPreview } from "../../hooks/useIamDraftPreview";
import { iamEditorFailure } from "../../hooks/iamEditorFailure";
import BizIamDelegationCandidatePicker from "../BizIamDelegationCandidatePicker.vue";
import BizIamDurationFields from "../BizIamDurationFields.vue";
import BizIamPreviewAlert from "../BizIamPreviewAlert.vue";
import BizIamWizardNav from "../BizIamWizardNav.vue";
import BizIamTenantAssignmentScopeStep from "./BizIamTenantAssignmentScopeStep.vue";

defineOptions({ name: "BizIamTenantAssignmentDrawer" });
const props = defineProps<{ apis: TenantAssignmentApis }>();
const emits = defineEmits<{ success: [] }>();
const wizardSteps = [
  { title: "授权依据与接收对象", description: "确定分配资格和接收成员或用户组" },
  { title: "选择角色与设置有效期", description: "选择当前角色并设置共用有效期" },
  { title: "设置范围", description: "填写管理部门或指定对象" },
  { title: "预览与保存", description: "确认效果后提交" },
];
const visible = ref(false);
const step = ref(0);
const loading = ref(false);
const saving = ref(false);
const staleVersion = ref(false);
const scopeStep = ref<InstanceType<typeof BizIamTenantAssignmentScopeStep>>();
const editing = ref<ResourceDetail<TenantAssignmentRecord>>();
const sources = ref<TenantDelegationMine[]>([]);
const sourceId = ref("");
const members = ref<IamSelectOption[]>([]);
const groups = ref<IamSelectOption[]>([]);
const roles = ref<TenantAssignmentRoleDraft[]>([]);
const validFrom = ref<string>();
const validUntil = ref<string>();
const previewSnapshot = ref<{ items: TenantAssignmentInput[] }>();
const openingKey = ref(0);
const initial = ref("");
const { unavailable, contextEpoch, hasAction } = useCapabilities();
let opening = 0;
let initializing = false;

const selectionKey = computed(() => `${openingKey.value}:${sourceId.value}`);
const selectedSource = computed(() => sources.value.find((item) => item.id === sourceId.value));
const canAssignDirectly = computed(
  () =>
    !sources.value.length ||
    sources.value.some((source) =>
      source.directAssignmentActions?.includes(
        editing.value ? IamAction.TENANT_ASSIGNMENT_UPDATE : IamAction.TENANT_ASSIGNMENT_CREATE,
      ),
    ),
);
const ready = computed(
  () => !loading.value && (!!editing.value || canAssignDirectly.value || !!sourceId.value),
);
const sourceLabel = (source: TenantDelegationMine): string =>
  `${source.allowedRoles.map((role) => role.name).join("、")} · ${source.recipientSummary}`;
const basisLabel = computed(() => {
  if (editing.value)
    return (
      editing.value.record.delegationSummary ||
      (sourceId.value ? `来源委派 ${sourceId.value}` : "直接分配")
    );
  return selectedSource.value ? sourceLabel(selectedSource.value) : "直接分配";
});

const memberPickerContext = inject(organizationMemberPickerKey, undefined);
const loadMemberBrowse = computed<OrganizationMemberBrowseLoader | undefined>(() =>
  memberPickerContext?.browse
    ? (params) =>
        memberPickerContext.browse!({
          ...params,
          scene: OrganizationMemberScene.ASSIGNMENT,
          delegationGrantId: sourceId.value || undefined,
        })
    : undefined,
);
const optionsAPI: AuthorizationCandidatesApi = async (q) => {
  const response = await props.apis.optionsAPI({
    kind: q.kind as "ROLE" | "MEMBER" | "GROUP",
    delegationGrantId: sourceId.value || undefined,
    keyword: q.keyword,
    departmentId: q.departmentId,
    ids: q.ids,
    page: q.page,
    pageSize: q.pageSize,
  });
  return {
    ...response,
    data: {
      ...response.data,
      items: response.data.items.map((item) => ({
        ...item,
        summary: item.departments?.map((department) => department.name).join("、"),
      })),
      total: Number(response.data.total || 0),
      supported: true,
    },
  };
};
const scopeApiFor =
  (roleId: string): AuthorizationCandidatesApi =>
  (q) =>
    props.apis.scopeAPI({
      roleId,
      parameterKey: q.parameterKey || "",
      delegationGrantId: sourceId.value || undefined,
      keyword: q.keyword,
      ids: q.ids,
      page: q.page,
      pageSize: q.pageSize,
      tree: q.tree,
      parentId: q.parentId,
    });
const privateOptions = (options: IamSelectOption[]): IamSelectOption[] =>
  options.map(({ id, name }) => ({ id, name }));

const draft = computed(() =>
  tenantAssignmentBatch(
    editing.value
      ? [editing.value.record.assignment.subject]
      : [
          ...members.value.map(({ id }) => ({ type: SubjectType.MEMBER, id })),
          ...groups.value.map(({ id }) => ({ type: SubjectType.GROUP, id })),
        ],
    roles.value,
    validFrom.value,
    validUntil.value,
    sourceId.value || undefined,
  ),
);
const fingerprint = computed(() => JSON.stringify(draft.value));
const pendingRoles = computed(() => roles.value.filter((item) => !item.definition));
const scopeIssues = computed(() => tenantAssignmentScopeIssues(roles.value));
const validityIssue = computed(() =>
  tenantAssignmentValidityIssue(validFrom.value, validUntil.value, selectedSource.value),
);
const canAdvance = computed(() => {
  if (loading.value || saving.value || !ready.value) return false;
  if (step.value === 0) return !!editing.value || members.value.length + groups.value.length > 0;
  if (step.value === 1)
    return roles.value.length > 0 && !pendingRoles.value.length && !validityIssue.value;
  return true;
});
const previewState = useIamDraftPreview<
  { items: TenantAssignmentInput[] },
  AssignmentPreviewResult
>({
  contextEpoch: () => `${contextEpoch.value}:${editing.value?.version || "0"}`,
  preview: async (input) => (await props.apis.previewAPI(input)).data,
});
watch(
  draft,
  () => {
    previewSnapshot.value = undefined;
    previewState.bumpDraft();
  },
  { deep: true },
);
const canSubmit = computed(
  () =>
    ready.value &&
    !unavailable.value &&
    !staleVersion.value &&
    previewState.preview.value?.valid === true &&
    !previewState.loading.value &&
    !saving.value &&
    hasAction(
      editing.value ? IamAction.TENANT_ASSIGNMENT_UPDATE : IamAction.TENANT_ASSIGNMENT_CREATE,
    ),
);

const subjectName = (item: TenantAssignmentInput): string =>
  editing.value?.record.subjectName ||
  (item.subject.type === SubjectType.MEMBER ? members.value : groups.value).find(
    (value) => value.id === item.subject.id,
  )?.name ||
  item.subject.id;
const previewItemLabel = (index: number): string => {
  const item = previewSnapshot.value?.items[index];
  if (!item) return "分配资料不可用";
  const role = roles.value.find((value) => value.role.id === item.roleId)?.role.name || item.roleId;
  return `${item.subject.type === SubjectType.MEMBER ? "成员" : "用户组"} / ${subjectName(item)} · ${role}`;
};
const previewScopeLabel = (index: number): string => {
  const item = previewSnapshot.value?.items[index];
  const role = roles.value.find((value) => value.role.id === item?.roleId);
  if (!role) return "";
  return `${role.definition?.items.length || 0} 项操作；${
    Object.entries(role.bindings)
      .map(([key, binding]) =>
        role.selectedObjects[key]?.length === binding.ids.length
          ? role.selectedObjects[key].map((object) => object.name).join("、")
          : `已选 ${binding.ids.length} 项`,
      )
      .join("；") || "无需对象参数"
  }`;
};

const privateLoadDefinitions = async (targets: TenantAssignmentRoleDraft[]): Promise<void> => {
  const epoch = opening;
  const source = sourceId.value || undefined;
  await Promise.all(
    targets.map(async ({ role }) => {
      try {
        const response = await props.apis.roleAPI(role.id, source);
        if (epoch !== opening || source !== (sourceId.value || undefined)) return;
        roles.value = roles.value.map((item) =>
          item.role.id === role.id ? applyTenantRoleDefinition(item, response.data) : item,
        );
      } catch (error) {
        if (epoch === opening) await iamEditorFailure(error);
      }
    }),
  );
};
const privateRoles = (options: IamSelectOption[]): void => {
  roles.value = reconcileTenantAssignmentRoles(roles.value, options);
  void privateLoadDefinitions(pendingRoles.value);
};
watch(
  sourceId,
  () => {
    if (initializing || editing.value) return;
    members.value = [];
    groups.value = [];
    roles.value = [];
  },
  { flush: "sync" },
);
watch(contextEpoch, () => {
  opening += 1;
  visible.value = false;
});
watch(visible, (value) => {
  if (!value) {
    opening += 1;
    previewState.bumpDraft();
  }
});

const privateBeforeClose = (done: () => void): void => {
  if (saving.value) return;
  if (initial.value === fingerprint.value) {
    done();
    return;
  }
  const epoch = opening;
  void confirmUnsavedChanges().then((allowed) => {
    if (allowed && epoch === opening) done();
  });
};
const privateNext = (): void => {
  if (step.value === 2 && (scopeIssues.value.length || validityIssue.value)) {
    void scopeStep.value?.showOutstanding();
    Message.warning(scopeIssues.value[0] || validityIssue.value!);
    return;
  }
  if (canAdvance.value && step.value < wizardSteps.length - 1) step.value += 1;
};
const handleFailure = async (error: unknown): Promise<void> => {
  if (isApiError(error) && error.status === 409) {
    if (editing.value) {
      staleVersion.value = true;
      Message.warning("分配已被他人修改，当前输入暂留在抽屉中，请重新打开查看最新内容");
    } else {
      Message.warning("授权条件已变化，请检查当前选择并重新预览");
    }
    return;
  }
  await iamEditorFailure(error);
};
const runPreview = async (): Promise<void> => {
  if (saving.value || staleVersion.value || previewState.loading.value) return;
  if (!draft.value.items.length || !ready.value) {
    Message.warning("请选择授权依据、接收对象和角色");
    return;
  }
  if (scopeIssues.value.length || validityIssue.value) {
    Message.warning(scopeIssues.value[0] || validityIssue.value!);
    return;
  }
  const epoch = opening;
  const snapshot = draft.value;
  const revision = previewState.draftRevision.value;
  try {
    await previewState.runPreview(snapshot);
    if (
      epoch === opening &&
      revision === previewState.draftRevision.value &&
      previewState.preview.value
    ) {
      if (previewState.preview.value.effectiveResult?.items.length !== snapshot.items.length) {
        previewState.bumpDraft();
        Message.warning("预览结果与分配数量不一致，请重试");
      } else previewSnapshot.value = snapshot;
    }
  } catch (error) {
    if (epoch === opening) {
      previewState.bumpDraft();
      await handleFailure(error);
    }
  }
};
const submit = async (): Promise<void> => {
  if (!canSubmit.value) return;
  const epoch = opening;
  saving.value = true;
  try {
    if (editing.value)
      await props.apis.updateAPI(editing.value.record.id, {
        expectedVersion: editing.value.version,
        assignment: draft.value.items[0],
      });
    else await props.apis.createAPI(draft.value);
    await refreshSessionPermissions({ refreshMenusIfVersionChanged: true }).catch(() =>
      Message.warning("已保存，权限刷新暂不可用，请稍后重试"),
    );
    Message.success("已保存角色分配");
    if (epoch === opening) visible.value = false;
    emits("success");
  } catch (error) {
    if (epoch === opening) {
      previewState.bumpDraft();
      await handleFailure(error);
    }
  } finally {
    saving.value = false;
  }
};

const show = async (row?: ResourceDetail<TenantAssignmentRecord>): Promise<void> => {
  initializing = true;
  const epoch = ++opening;
  openingKey.value += 1;
  visible.value = true;
  step.value = 0;
  loading.value = true;
  staleVersion.value = false;
  editing.value = row;
  sources.value = [];
  members.value = [];
  groups.value = [];
  const input = row?.record.assignment;
  sourceId.value = input?.delegationGrantId || "";
  roles.value = input
    ? [
        {
          role: { id: input.roleId, name: row!.record.roleName || input.roleId },
          bindings: Object.fromEntries(
            Object.entries(input.scopeBindings).map(([key, binding]) => [
              key,
              { ...binding, ids: [...binding.ids] },
            ]),
          ),
          selectedObjects: {},
        },
      ]
    : [];
  validFrom.value = input?.validFrom;
  validUntil.value = input?.validUntil;
  previewSnapshot.value = undefined;
  previewState.bumpDraft();
  initial.value = fingerprint.value;
  initializing = false;
  try {
    const response = await props.apis.mineAPI();
    if (epoch !== opening) return;
    initializing = true;
    sources.value = response.data;
    if (!row && !canAssignDirectly.value && sources.value.length)
      sourceId.value = sources.value[0].id;
    initializing = false;
    if (row) await privateLoadDefinitions(roles.value);
    if (epoch === opening) initial.value = fingerprint.value;
  } catch (error) {
    if (epoch === opening) await iamEditorFailure(error);
  } finally {
    initializing = false;
    if (epoch === opening) loading.value = false;
  }
};
defineExpose({ show });
</script>
