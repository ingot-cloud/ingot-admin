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
          {{ editing.record.delegationSummary || (sourceId ? `来源委派 ${sourceId}` : "直接分配") }}
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
          允许 {{ basis.delegation?.allowedRoleRevisionRefs.length || 0 }} 个角色版本； 有效期：{{
            basis.delegation?.validFrom || "立即"
          }}
          至
          {{ basis.delegation?.validUntil || "长期" }}
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
          {{ editing.record.roleName || revisionId }} · v{{ editing.record.revisionNumber || "-" }}
        </div>
        <biz-iam-authorization-role-picker
          v-else
          v-model="roleSelection"
          :tree-api="prefilledRoleCandidatesApi"
          :detail-api="candidatesApi"
          :delegation-grant-id="sourceId || undefined"
          :disabled="!ready || saving"
          :reset-key="selectionKey"
          @change="privateSetRole"
          @invalidated="privateClearRole"
        />
        <span class="mt-4px text-12px text-[var(--el-text-color-secondary)]">
          为所有接收对象分配此版本，角色发布新版本后不会自动替换。
        </span>
      </el-form-item>
    </in-form>
    <in-form v-else-if="step === 2" label-position="top" class="max-w-720px">
      <el-form-item v-for="(binding, key) in bindings" :key="key" label="指定对象">
        <span v-if="readonly">{{ binding.ids.join("、") || "无对象范围" }}</span>
        <biz-iam-delegation-candidate-picker
          v-else
          v-model="binding.ids"
          :api="candidatesApi"
          multiple
          :disabled="loading || saving"
          :query="{
            kind: 'OBJECT',
            delegationGrantId: sourceId || undefined,
            revisionId,
            parameterKey: String(key),
          }"
          title="选择指定对象"
          placeholder="请选择资源下的范围对象"
          search-placeholder="搜索范围对象"
        />
      </el-form-item>
      <el-form-item label="生效时间与失效时间">
        <span v-if="readonly">{{ validFrom || "立即" }} 至 {{ validUntil || "长期" }}</span>
        <biz-iam-duration-fields
          v-else
          v-model:valid-from="validFrom"
          v-model:valid-until="validUntil"
        />
        <span v-if="!readonly" class="mt-4px text-12px text-[var(--el-text-color-secondary)]">
          新建时不填生效时间即立即生效；使用委派时，授权期限不得超出委派限制。
        </span>
      </el-form-item>
    </in-form>
    <div v-else class="max-w-720px flex flex-col gap-16px">
      <div>授权依据：{{ basis?.name || (sourceId ? `来源委派 ${sourceId}` : "直接分配") }}</div>
      <div>接收对象：{{ editing?.record.subjectName || [...members, ...groups].map((item) => item.name).join("、") }}</div>
      <div>角色版本：{{ editing?.record.roleName || roleSelection?.roleName || revisionId }}</div>
      <div>有效期：{{ validFrom || "立即" }} 至 {{ validUntil || "长期" }}</div>
      <biz-iam-preview-alert :preview="previewState.preview.value" />
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
import BizIamDelegationCandidatePicker from "./BizIamDelegationCandidatePicker.vue";
import BizIamAuthorizationRecipients from "./BizIamAuthorizationRecipients.vue";
import BizIamAuthorizationRolePicker from "./BizIamAuthorizationRolePicker.vue";
import BizIamDurationFields from "./BizIamDurationFields.vue";
import BizIamPreviewAlert from "./BizIamPreviewAlert.vue";
import BizIamWizardNav from "./BizIamWizardNav.vue";
import {
  SubjectType,
  RoleKind,
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
  type AuthorizationRoleNode,
  type AuthorizationOption,
  type IamSelectOption,
  type ScopeBinding,
  type CreatedResource,
  type Preview,
} from "../models/iam";
defineOptions({ name: "BizIamPlatformAssignmentDrawer" });
const props = defineProps<{
  candidatesApi: AuthorizationCandidatesApi;
  roleCandidatesApi: AuthorizationRoleCandidatesApi;
  contextApi: () => Promise<R<AssignmentContext>>;
  getApi: (id: string) => Promise<R<ResourceDetail<AssignmentRecord>>>;
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
const wizardSteps = [
  { title: "授权依据与接收对象", description: "确定分配资格和接收成员或用户组" },
  { title: "选择角色", description: "选择一个固定角色版本" },
  { title: "设置范围与有效期", description: "配置对象范围和生效区间" },
  { title: "预览与保存", description: "确认效果后提交" },
];
const loading = ref(false);
const saving = ref(false);
const context = ref<AssignmentContext>();
const editing = ref<ResourceDetail<AssignmentRecord>>();
const presetRoleId = ref<string>();
const prefilledRoleCandidatesApi: AuthorizationRoleCandidatesApi = (query) => props.roleCandidatesApi(
  presetRoleId.value && !query.roleId ? { ...query, ids: [presetRoleId.value] } : query,
);
const sourceId = ref("");
const basis = ref<AuthorizationOption>();
const members = ref<IamSelectOption[]>([]);
const groups = ref<IamSelectOption[]>([]);
const revisionId = ref("");
const roleSelection = ref<AuthorizationRoleNode>();
const revisionKind = ref(RoleKind.PLATFORM_CUSTOM);
const bindings = ref<Record<string, ScopeBinding>>({});
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
const draft = computed<AssignmentBatchInput>(() => ({
  items: (editing.value
    ? [editing.value.record.assignment.subject]
    : [
        ...members.value.map(({ id }) => ({ type: SubjectType.MEMBER, id })),
        ...groups.value.map(({ id }) => ({ type: SubjectType.GROUP, id })),
      ]
  ).map((subject) => ({
    subject,
    roleRevisionRef: { kind: revisionKind.value, id: revisionId.value },
    scopeBindings: bindings.value,
    validFrom: validFrom.value,
    validUntil: validUntil.value,
    delegationGrantId: sourceId.value || undefined,
  })),
}));
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
watch(draft, previewState.bumpDraft, { deep: true });
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
  if (step.value === 1) return !!revisionId.value;
  return true;
});
const privateNext = (): void => {
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
  roleSelection.value = undefined;
  revisionId.value = "";
  bindings.value = {};
};
const privateSetRole = (node: AuthorizationRoleNode, option: AuthorizationOption): void => {
  const reference = node.roleRevisionRef;
  if (!reference) return;
  const changed = revisionId.value !== reference.id || revisionKind.value !== reference.kind;
  roleSelection.value = node;
  revisionId.value = reference.id;
  revisionKind.value = reference.kind;
  if (!changed) return;
  bindings.value = Object.fromEntries(
    (option.parameterDefinitions || []).map((parameter) => [
      parameter.key,
      { kind: parameter.kind, ids: [] },
    ]),
  );
};
const runPreview = async (): Promise<void> => {
  if (readonly.value || saving.value || staleVersion.value || previewState.loading.value) return;
  if (!draft.value.items.length || !revisionId.value || !ready.value) {
    Message.warning("请选择授权依据、接收对象和角色");
    return;
  }
  const epoch = opening;
  try {
    await previewState.runPreview(draft.value);
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
  revisionId.value = input.roleRevisionRef.id;
  revisionKind.value = input.roleRevisionRef.kind;
  bindings.value = Object.fromEntries(
    Object.entries(input.scopeBindings).map(([key, binding]) => [
      key,
      { ...binding, ids: [...binding.ids] },
    ]),
  );
  validFrom.value = input.validFrom;
  validUntil.value = input.validUntil;
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
  async show(row?: ResourceDetail<AssignmentRecord>, preset?: { memberId?: string; roleId?: string }) {
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
        if (epoch === opening) apply(detail.data);
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
