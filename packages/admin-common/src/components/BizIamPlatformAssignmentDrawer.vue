<template>
  <in-drawer
    v-model="visible"
    :title="editing ? '调整角色分配' : '分配角色'"
    :loading="loading"
    size="100%"
    layout="pinned"
    padding="0"
    close-position="start"
  >
    <div v-if="visible" class="in-wizard-frame flex h-full min-h-0">
      <biz-iam-wizard-nav :steps="wizardSteps" :current="step" />
      <section class="flex-1 min-w-0 min-h-0 flex flex-col px-48px py-24px">
        <div class="mb-24px text-18px shrink-0">{{ wizardSteps[step].title }}</div>
        <div class="flex-1 min-h-0 overflow-auto">
          <in-form v-if="step === 0" label-position="top" class="max-w-720px">
            <el-form-item label="授权依据" :required="!editing && !context?.directCreate">
              <div v-if="editing">
                {{
                  editing.record.delegationSummary ||
                  (sourceId ? `来源委派 ${sourceId}` : "直接分配")
                }}
              </div>
              <div v-else-if="context?.directCreate" class="flex flex-col gap-4px">
                <span>直接分配</span>
                <span class="text-12px text-[var(--el-text-color-secondary)]">
                  你拥有直接分配资格，无需绑定委派。
                </span>
              </div>
              <biz-iam-authorization-select
                v-else
                v-model="sourceId"
                :api="candidatesApi"
                :query="{ kind: 'DELEGATION' }"
                :disabled="loading || saving"
                :initial-options="sourceOptions"
                :initial-page="sourcePage"
                :reset-key="selectionKey"
                placeholder="请选择授权委派"
                @change="setBasis"
              />
              <div v-if="basis" class="mt-8px text-[var(--el-text-color-secondary)]">
                {{ basis.summary }}<br />
                允许 {{ basis.delegation?.allowedRoleRevisionRefs.length || 0 }} 个角色版本；
                有效期：{{ formatDateTime(basis.delegation?.validFrom, { fallback: "立即" }) }}
                至
                {{ formatDateTime(basis.delegation?.validUntil, { fallback: "长期" }) }}
              </div>
              <span
                v-if="!editing && !context?.directCreate"
                class="mt-4px text-12px text-[var(--el-text-color-secondary)]"
              >
                依据你持有的授权委派进行分配，可选角色、接收对象和范围受该委派限制。
              </span>
            </el-form-item>
            <el-form-item label="接收对象" required>
              <div v-if="editing">
                {{ editing.record.subjectName || editing.record.assignment.subject.id }}
              </div>
              <biz-iam-authorization-recipients
                v-else
                v-model:members="members"
                v-model:groups="groups"
                :api="candidatesApi"
                :delegation-grant-id="sourceId || undefined"
                :reset-key="selectionKey"
                :disabled="!ready || saving"
              />
            </el-form-item>
          </in-form>
          <in-form v-else-if="step === 1" label-position="top" class="max-w-720px">
            <el-form-item label="角色" required>
              <div v-if="editing">
                {{ editing.record.roleName || revisionId }} · v{{
                  editing.record.revisionNumber || "-"
                }}
              </div>
              <biz-iam-delegation-role-picker
                v-else
                v-model="roleOptions"
                :tree-api="prefilledRoleCandidatesApi"
                :detail-api="scopedRoleDetailsApi"
                :disabled="!ready || saving"
                :reset-key="selectionKey"
                one-version-per-role
                placeholder="请选择角色及固定版本"
                title="选择角色"
              />
              <span class="mt-4px text-12px text-[var(--el-text-color-secondary)]">
                每个角色选择一个固定版本，所选角色分配给所有接收对象；发布新版本后不会自动替换。
              </span>
              <div v-if="editing && !roleOptions[0]?.actions" class="mt-8px">
                <span class="text-12px text-[var(--el-color-warning)]"
                  >固定版本资料未加载，无法配置范围。</span
                >
                <in-button link type="primary" @in-click="retryStoredRole">重新加载</in-button>
              </div>
            </el-form-item>
            <el-form-item label="生效时间与失效时间">
              <span v-if="readonly"
                >{{ formatDateTime(validFrom, { fallback: "立即" }) }} 至
                {{ formatDateTime(validUntil, { fallback: "长期" }) }}</span
              >
              <biz-iam-duration-fields
                v-else
                v-model:valid-from="validFrom"
                v-model:valid-until="validUntil"
              />
              <span v-if="!readonly" class="mt-4px text-12px text-[var(--el-text-color-secondary)]">
                所选角色共用有效期；新建时留空表示立即生效、长期有效。使用委派时须符合来源期限限制。
              </span>
            </el-form-item>
            <el-alert
              v-if="validityIssue && !readonly"
              :title="validityIssue"
              type="warning"
              :closable="false"
            />
          </in-form>
          <in-form v-else-if="step === 2" label-position="top" class="max-w-720px">
            <div class="mb-24px">
              <biz-iam-assignment-scope-step
                ref="scopeStep"
                v-model:roles="roles"
                :api="candidatesApi"
                :selected-api="editing ? storedCandidatesApi : undefined"
                :delegation-grant-id="sourceId || undefined"
                :reset-key="selectionKey"
                :readonly="readonly"
              />
            </div>
          </in-form>
          <div v-else class="max-w-720px flex flex-col gap-16px">
            <div>
              授权依据：{{ basis?.name || (sourceId ? `来源委派 ${sourceId}` : "直接分配") }}
            </div>
            <div>
              接收对象：{{
                editing?.record.subjectName ||
                [...members, ...groups].map((item) => item.name).join("、")
              }}
            </div>
            <div>角色版本：{{ roleOptions.map((option) => option.name).join("、") }}</div>
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
              class="mt-12px"
              type="warning"
              :closable="false"
              title="分配已被他人修改，当前输入暂留在抽屉中；重新打开会载入最新内容。"
            />
          </div>
        </div>
      </section>
    </div>
    <template #footer>
      <in-button @click="visible = false">取消</in-button>
      <in-button v-if="step > 0" @in-click="step -= 1">上一步</in-button>
      <in-button v-if="step < 3" type="primary" :disabled="!canAdvance" @in-click="privateNext">
        下一步
      </in-button>
      <in-button
        v-if="step === 3 && !readonly"
        :loading="previewState.loading.value"
        :disabled="saving || !ready || staleVersion"
        @in-click="runPreview"
        >预览效果</in-button
      >
      <in-button
        v-if="step === 3 && !readonly && previewState.preview.value?.valid === true"
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
import { formatDateTime } from "@ingot/shared";
import {
  isApiError,
  Message,
  objectActionAllowed,
  useCapabilities,
  type R,
} from "@ingot/admin-core";
import { useIamDraftPreview } from "../hooks/useIamDraftPreview";
import { iamEditorFailure } from "../hooks/iamEditorFailure";
import BizIamAuthorizationSelect from "./BizIamAuthorizationSelect.vue";
import BizIamAssignmentScopeStep from "./BizIamAssignmentScopeStep.vue";
import BizIamAuthorizationRecipients from "./BizIamAuthorizationRecipients.vue";
import BizIamDelegationRolePicker from "./BizIamDelegationRolePicker.vue";
import {
  assignmentBatch,
  assignmentScopeIssues,
  assignmentValidityIssue,
  reconcileAssignmentRoles,
  type PlatformAssignmentRoleDraft,
} from "../models/iam/platformAssignment";
import BizIamDurationFields from "./BizIamDurationFields.vue";
import BizIamPreviewAlert from "./BizIamPreviewAlert.vue";
import BizIamWizardNav from "./BizIamWizardNav.vue";
import {
  SubjectType,
  IamAction,
  IAM_DEFAULT_PAGE_SIZE,
  type AssignmentContext,
  type AssignmentRecord,
  type ResourceDetail,
  type AssignmentBatchInput,
  type AssignmentUpdateInput,
  type AssignmentPreviewResult,
  type AuthorizationCandidatesApi,
  type AuthorizationCandidatePage,
  type AuthorizationRoleCandidatesApi,
  type AuthorizationOption,
  type IamSelectOption,
  type CreatedResource,
  type Preview,
} from "../models/iam";
defineOptions({ name: "BizIamPlatformAssignmentDrawer" });
const props = defineProps<{
  candidatesApi: AuthorizationCandidatesApi;
  roleCandidatesApi: AuthorizationRoleCandidatesApi;
  contextApi: () => Promise<R<AssignmentContext>>;
  getApi: (id: string) => Promise<R<ResourceDetail<AssignmentRecord>>>;
  selectedCandidatesApi: (
    id: string,
    query: Parameters<AuthorizationCandidatesApi>[0],
  ) => Promise<R<AuthorizationCandidatePage>>;
  createApi: (input: AssignmentBatchInput) => Promise<R<CreatedResource>>;
  updateApi: (
    id: string,
    input: AssignmentUpdateInput,
  ) => Promise<R<ResourceDetail<AssignmentRecord>>>;
  previewApi: (input: AssignmentBatchInput) => Promise<R<Preview<AssignmentPreviewResult>>>;
  updatePreviewApi: (
    id: string,
    input: AssignmentUpdateInput,
  ) => Promise<R<Preview<AssignmentPreviewResult>>>;
}>();
const emits = defineEmits<{ success: [] }>();
const visible = ref(false);
const step = ref(0);
const scopeStep = ref<InstanceType<typeof BizIamAssignmentScopeStep>>();
const wizardSteps = [
  { title: "授权依据与接收对象", description: "确定分配资格和接收成员或用户组" },
  { title: "选择角色与设置有效期", description: "选择固定版本并设置共用有效期" },
  { title: "设置范围", description: "填写具体对象，核对全部授权范围" },
  { title: "预览与保存", description: "确认效果后提交" },
];
const loading = ref(false);
const saving = ref(false);
const context = ref<AssignmentContext>();
const editing = ref<ResourceDetail<AssignmentRecord>>();
const presetRoleId = ref<string>();
const prefilledRoleCandidatesApi: AuthorizationRoleCandidatesApi = (query) =>
  props.roleCandidatesApi({
    ...(presetRoleId.value && !query.roleId ? { ...query, ids: [presetRoleId.value] } : query),
    delegationGrantId: sourceId.value || undefined,
  });
const sourceId = ref("");
const basis = ref<AuthorizationOption>();
const members = ref<IamSelectOption[]>([]);
const groups = ref<IamSelectOption[]>([]);
const roles = ref<PlatformAssignmentRoleDraft[]>([]);
const roleOptions = computed({
  get: () => roles.value.map((role) => role.option),
  set: (options: AuthorizationOption[]) => {
    roles.value = reconcileAssignmentRoles(roles.value, options);
  },
});
const revisionId = computed(() => roleOptions.value[0]?.id || "");
const scopedRoleDetailsApi: AuthorizationCandidatesApi = (query) =>
  props.candidatesApi({ ...query, delegationGrantId: sourceId.value || undefined });
const storedCandidatesApi: AuthorizationCandidatesApi = (query) =>
  props.selectedCandidatesApi(editing.value!.record.id, query);
const previewSnapshot = ref<AssignmentBatchInput>();
const validFrom = ref<string>();
const validUntil = ref<string>();
const staleVersion = ref(false);
const { contextEpoch } = useCapabilities();
const openingKey = ref(0);
const sourceOptions = ref<AuthorizationOption[]>([]);
const sourcePage = ref<AuthorizationCandidatePage>();
const selectionKey = computed(() => `${openingKey.value}:${contextEpoch.value}`);
const ready = computed(
  () =>
    !loading.value &&
    (!!editing.value || (!!context.value && (context.value.directCreate || !!sourceId.value))),
);
const draft = computed<AssignmentBatchInput>(() =>
  assignmentBatch(
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
const scopeIssues = computed(() => assignmentScopeIssues(roles.value));
const validityIssue = computed(() =>
  assignmentValidityIssue(validFrom.value, validUntil.value, basis.value?.delegation),
);
const previewItemLabel = (index: number): string => {
  const item = previewSnapshot.value?.items[index];
  if (!item) return "分配资料不可用";
  const subject =
    editing.value?.record.subjectName ||
    (item.subject.type === SubjectType.MEMBER ? members.value : groups.value).find(
      (value) => value.id === item.subject.id,
    )?.name ||
    item.subject.id;
  const role =
    roleOptions.value.find((option) => option.id === item.roleRevisionRef.id)?.name ||
    item.roleRevisionRef.id;
  return `${item.subject.type === SubjectType.MEMBER ? "成员" : "用户组"} / ${subject} · ${role}`;
};
const previewScopeLabel = (index: number): string => {
  const item = previewSnapshot.value?.items[index];
  const role = roles.value.find((value) => value.option.id === item?.roleRevisionRef.id);
  return role
    ? `${role.option.grants?.length || 0} 项操作；${
        Object.entries(role.bindings)
          .map(([key, binding]) =>
            role.selectedObjects[key]?.length === binding.ids.length
              ? role.selectedObjects[key].map((object) => object.name).join("、")
              : `指定对象 ${binding.ids.length} 项`,
          )
          .join("；") || "无需对象参数"
      }`
    : "";
};
const previewState = useIamDraftPreview<AssignmentBatchInput, AssignmentPreviewResult>({
  contextEpoch: () => `${contextEpoch.value}:${editing.value?.version || "0"}`,
  preview: async (input) =>
    (editing.value
      ? await props.updatePreviewApi(editing.value.record.id, {
          expectedVersion: editing.value.version,
          assignment: input.items[0],
        })
      : await props.previewApi(input)
    ).data,
});
watch(
  draft,
  () => {
    previewSnapshot.value = undefined;
    previewState.bumpDraft();
  },
  { deep: true },
);
const readonly = computed(
  () =>
    !!editing.value &&
    !objectActionAllowed(editing.value.capabilities, IamAction.PLATFORM_ASSIGNMENT_UPDATE).allowed,
);
const canSubmit = computed(
  () =>
    ready.value &&
    !readonly.value &&
    !staleVersion.value &&
    previewState.preview.value?.valid === true &&
    !previewState.loading.value &&
    !saving.value,
);
const canAdvance = computed(() => {
  if (loading.value || saving.value || !ready.value) return false;
  if (step.value === 0) return !!editing.value || members.value.length + groups.value.length > 0;
  if (step.value === 1) return roles.value.length > 0 && (readonly.value || !validityIssue.value);
  return true;
});
const privateNext = (): void => {
  if (step.value === 2 && !readonly.value && (scopeIssues.value.length || validityIssue.value)) {
    void scopeStep.value?.showOutstanding();
    Message.warning(scopeIssues.value[0] || validityIssue.value!);
    return;
  }
  if (canAdvance.value && step.value < wizardSteps.length - 1) step.value += 1;
};
const handleAssignmentFailure = async (error: unknown): Promise<void> => {
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
const setBasis = (options: AuthorizationOption[]): void => {
  basis.value = options[0];
  privateClearRole();
  members.value = [];
  groups.value = [];
};
const privateClearRole = (): void => {
  roles.value = [];
};
const runPreview = async (): Promise<void> => {
  if (readonly.value || saving.value || staleVersion.value || previewState.loading.value) return;
  if (!draft.value.items.length || !revisionId.value || !ready.value) {
    Message.warning("请选择授权依据、接收对象和角色");
    return;
  }
  const epoch = opening;
  try {
    if (scopeIssues.value.length || validityIssue.value) {
      Message.warning(scopeIssues.value[0] || validityIssue.value!);
      return;
    }
    const snapshot = draft.value;
    const revision = previewState.draftRevision.value;
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
      await handleAssignmentFailure(error);
    }
  }
};
const submit = async (): Promise<void> => {
  if (!canSubmit.value || saving.value) return;
  const epoch = opening;
  saving.value = true;
  try {
    if (editing.value)
      await props.updateApi(editing.value.record.id, {
        expectedVersion: editing.value.version,
        assignment: draft.value.items[0],
      });
    else await props.createApi(draft.value);
    Message.success("已保存角色分配");
    if (epoch === opening) visible.value = false;
    emits("success");
  } catch (error) {
    if (epoch === opening) {
      previewState.bumpDraft();
      await handleAssignmentFailure(error);
    }
  } finally {
    saving.value = false;
  }
};
const apply = (row: ResourceDetail<AssignmentRecord>): void => {
  editing.value = row;
  const input = row.record.assignment;
  sourceId.value = input.delegationGrantId || "";
  roles.value = [
    {
      option: {
        id: input.roleRevisionRef.id,
        name: `${row.record.roleName || "角色"} · v${row.record.revisionNumber || "-"}`,
        roleRevisionRef: input.roleRevisionRef,
      },
      bindings: Object.fromEntries(
        Object.entries(input.scopeBindings).map(([key, binding]) => [
          key,
          { ...binding, ids: [...binding.ids] },
        ]),
      ),
      selectedObjects: {},
    },
  ];
  validFrom.value = input.validFrom;
  validUntil.value = input.validUntil;
};
const loadStoredRole = async (epoch: number): Promise<void> => {
  if (!editing.value) return;
  const selected = await props.selectedCandidatesApi(editing.value.record.id, {
    kind: "ROLE_REVISION",
    page: 1,
    pageSize: IAM_DEFAULT_PAGE_SIZE,
  });
  const option = selected.data.items.find(
    (item) => item.id === editing.value?.record.assignment.roleRevisionRef.id,
  );
  if (epoch === opening && visible.value && option) roles.value = [{ ...roles.value[0], option }];
};
const retryStoredRole = async (): Promise<void> => {
  const epoch = opening;
  loading.value = true;
  try {
    await loadStoredRole(epoch);
  } catch (error) {
    if (epoch === opening) await iamEditorFailure(error);
  } finally {
    if (epoch === opening) loading.value = false;
  }
};
let opening = 0;
let qualificationRefreshPending = false;
const privateLoadContext = async (epoch: number, retainBasis = false): Promise<void> => {
  const response = await props.contextApi();
  if (epoch !== opening || !visible.value) return;
  context.value = response.data;
  if (response.data.directCreate) {
    sourceId.value = "";
    basis.value = undefined;
    sourceOptions.value = [];
    sourcePage.value = undefined;
    return;
  }
  if (!response.data.effectiveDelegationCount) {
    sourcePage.value = undefined;
    sourceOptions.value = [];
    sourceId.value = "";
    setBasis([]);
    return;
  }
  const sources = await props.candidatesApi({
    kind: "DELEGATION",
    page: 1,
    pageSize: IAM_DEFAULT_PAGE_SIZE,
  });
  if (epoch !== opening || !visible.value) return;
  sourceOptions.value = sources.data.items;
  sourcePage.value = sources.data;
  if (retainBasis && sourceId.value) {
    let selected = sources.data.items.find((option) => option.id === sourceId.value);
    if (!selected) {
      const current = await props.candidatesApi({ kind: "DELEGATION", ids: [sourceId.value] });
      if (epoch !== opening || !visible.value) return;
      selected = current.data.items[0];
    }
    if (selected) {
      basis.value = selected;
      const selectedId = selected.id;
      sourceOptions.value = [
        ...sourceOptions.value.filter((option) => option.id !== selectedId),
        selected,
      ];
      return;
    }
    sourceId.value = "";
    setBasis([]);
    return;
  }
  if (sources.data.total === 1 && sources.data.items[0]) {
    sourceId.value = sources.data.items[0].id;
    basis.value = sources.data.items[0];
  }
};
/** 权限刷新时只重验当前草稿中的接收对象，不查询已保存的关联列表。 */
const privateRefreshRecipients = async (epoch: number): Promise<void> => {
  if (!context.value || (!context.value.directCreate && !sourceId.value)) return;
  const validate = async (
    kind: "MEMBER" | "GROUP",
    selected: IamSelectOption[],
  ): Promise<IamSelectOption[]> => {
    const allowed = new Map<string, IamSelectOption>();
    for (let start = 0; start < selected.length; start += IAM_DEFAULT_PAGE_SIZE) {
      if (epoch !== opening || !visible.value) return selected;
      const response = await props.candidatesApi({
        kind,
        delegationGrantId: sourceId.value || undefined,
        ids: selected.slice(start, start + IAM_DEFAULT_PAGE_SIZE).map(({ id }) => id),
        page: 1,
        pageSize: IAM_DEFAULT_PAGE_SIZE,
      });
      for (const { id, name } of response.data.items) allowed.set(id, { id, name });
    }
    return selected.flatMap(({ id }) => {
      const option = allowed.get(id);
      return option ? [option] : [];
    });
  };
  const [validMembers, validGroups] = await Promise.all([
    validate("MEMBER", members.value),
    validate("GROUP", groups.value),
  ]);
  if (epoch !== opening || !visible.value) return;
  members.value = validMembers;
  groups.value = validGroups;
};
const privateRefreshRoles = async (epoch: number): Promise<void> => {
  const current = roleOptions.value;
  const allowed: AuthorizationOption[] = [];
  for (let offset = 0; offset < current.length; offset += IAM_DEFAULT_PAGE_SIZE) {
    const response = await scopedRoleDetailsApi({
      kind: "ROLE_REVISION",
      ids: current.slice(offset, offset + IAM_DEFAULT_PAGE_SIZE).map((option) => option.id),
      page: 1,
      pageSize: IAM_DEFAULT_PAGE_SIZE,
    });
    if (epoch !== opening || !visible.value) return;
    allowed.push(
      ...response.data.items.map((option) => ({
        ...option,
        roleNode: current.find((item) => item.id === option.id)?.roleNode,
      })),
    );
  }
  roles.value = reconcileAssignmentRoles(roles.value, allowed).map((role) => ({
    ...role,
    selectedObjects: {},
  }));
};
const privateRefreshQualification = async (): Promise<void> => {
  if (!visible.value || loading.value || saving.value) return;
  qualificationRefreshPending = false;
  const epoch = ++opening;
  loading.value = true;
  try {
    if (editing.value) {
      const response = await props.getApi(editing.value.record.id);
      if (epoch === opening)
        editing.value = { ...editing.value, capabilities: response.data.capabilities };
    } else {
      await privateLoadContext(epoch, true);
      if (epoch === opening) await privateRefreshRecipients(epoch);
      if (epoch === opening) await privateRefreshRoles(epoch);
    }
  } catch {
    if (epoch !== opening) return;
    if (editing.value)
      editing.value = {
        ...editing.value,
        capabilities: { [IamAction.PLATFORM_ASSIGNMENT_UPDATE]: { allowed: false } },
      };
    else context.value = undefined;
    Message.warning("配置资格已变化，请重新打开角色分配确认；草稿已保留");
  } finally {
    if (epoch === opening) loading.value = false;
  }
};
watch(contextEpoch, () => {
  previewState.bumpDraft();
  qualificationRefreshPending = true;
  void privateRefreshQualification();
});
watch([loading, saving], () => {
  if (qualificationRefreshPending) void privateRefreshQualification();
});
const canPresetRecipient = (): boolean => !!context.value?.directCreate || !!sourceId.value;
defineExpose({
  async show(
    row?: ResourceDetail<AssignmentRecord>,
    preset?: { memberId?: string; roleId?: string },
  ) {
    const epoch = ++opening;
    qualificationRefreshPending = false;
    openingKey.value += 1;
    visible.value = true;
    step.value = 0;
    loading.value = true;
    editing.value = undefined;
    presetRoleId.value = preset?.roleId;
    staleVersion.value = false;
    sourceId.value = "";
    basis.value = undefined;
    members.value = [];
    groups.value = [];
    sourceOptions.value = [];
    sourcePage.value = undefined;
    privateClearRole();
    validFrom.value = undefined;
    validUntil.value = undefined;
    context.value = undefined;
    previewState.bumpDraft();
    try {
      if (row) {
        const detail = await props.getApi(row.record.id);
        if (epoch === opening) {
          apply(detail.data);
          await loadStoredRole(epoch);
        }
      } else await privateLoadContext(epoch);
      if (epoch !== opening || !visible.value) return;
      if (!row && preset?.memberId && canPresetRecipient()) {
        const candidate = await props.candidatesApi({
          kind: "MEMBER",
          delegationGrantId: sourceId.value || undefined,
          ids: [preset.memberId],
        });
        if (epoch === opening)
          members.value = candidate.data.items.map(({ id, name }) => ({ id, name }));
      }
    } catch (error) {
      if (epoch === opening) await iamEditorFailure(error);
    } finally {
      if (epoch === opening) loading.value = false;
    }
  },
});
watch(visible, (value) => {
  if (!value) {
    opening += 1;
    qualificationRefreshPending = false;
    previewState.bumpDraft();
  }
});
</script>
