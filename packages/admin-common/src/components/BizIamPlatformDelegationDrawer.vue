<template>
  <in-drawer
    v-model="visible"
    :title="editing ? '编辑委派' : '创建委派'"
    :loading="loading"
    size="100%"
    layout="pinned"
    padding="0"
    close-position="start"
    :before-close="privateOnBeforeClose"
  >
    <div class="in-wizard-frame flex h-full min-h-0">
      <biz-iam-wizard-nav :steps="WIZARD_STEPS" :current="step" />
      <section
        class="delegation-wizard-content flex-1 min-w-0 min-h-0 flex flex-col px-48px py-24px"
      >
        <div class="mb-24px text-18px shrink-0">{{ WIZARD_STEPS[step].title }}</div>
        <el-alert
          v-if="unavailableRevisionIds.length"
          class="mb-12px shrink-0"
          type="warning"
          :closable="false"
          title="部分原有角色版本已不可用，请重新确认允许分配的角色版本后预览"
        />
        <div class="flex-1 min-h-0" :class="step === 2 ? 'overflow-hidden' : 'overflow-auto'">
          <in-form v-if="step === 0" label-position="top" class="max-w-720px">
            <el-alert
              type="info"
              :closable="false"
              title="委派只提供限定的角色分配能力，不授予业务权限或二次委派资格。"
            />
            <el-form-item label="授权管理员" required class="mt-24px">
              <biz-iam-delegation-candidate-picker
                v-model="administratorId"
                :api="candidatesApi"
                :query="{ kind: 'MEMBER' }"
                :selected-options="administratorOptions"
                :reset-key="selectionKey"
                :disabled="readonly"
                title="选择授权管理员"
                placeholder="请选择授权管理员"
                search-placeholder="搜索管理员姓名"
                @selection="privateOnAdministratorSelection"
              />
            </el-form-item>
            <el-form-item label="允许分配的角色" required>
              <biz-iam-delegation-role-picker
                v-model="revisionOptions"
                :tree-api="roleCandidatesApi"
                :detail-api="candidatesApi"
                :disabled="readonly"
                :reset-key="selectionKey"
                @update:model-value="unavailableRevisionIds = []"
              />
            </el-form-item>
            <el-form-item label="允许接收的成员" required>
              <biz-iam-delegation-candidate-picker
                v-model="recipientIds"
                :api="candidatesApi"
                :query="{ kind: 'MEMBER', excludeMemberId: administratorId || undefined }"
                :selected-options="recipientOptions"
                :load-selected="selectedCandidates"
                :reset-key="selectionKey"
                multiple
                :disabled="readonly"
                title="选择允许接收的成员"
                placeholder="请选择允许接收的成员"
                search-placeholder="搜索成员姓名"
                @selection="privateOnRecipientSelection"
              />
              <span class="text-12px text-[var(--el-text-color-secondary)]">
                授权管理员只能将允许的角色版本分配给这些成员；不因此获得对成员的业务操作权限。
              </span>
            </el-form-item>
            <el-form-item label="委派生效与失效时间（可选）">
              <div v-if="readonly">
                {{ privateFormatInstant(validFrom, "立即生效") }} 至
                {{ privateFormatInstant(validUntil, "长期有效") }}
              </div>
              <biz-iam-duration-fields
                v-else
                v-model:valid-from="validFrom"
                v-model:valid-until="validUntil"
              />
              <span class="text-12px text-[var(--el-text-color-secondary)]">
                留空分别表示立即生效、长期有效。
              </span>
            </el-form-item>
            <el-form-item label="单次分配期限" required>
              <div v-if="readonly">
                {{ durationMode === "UNLIMITED" ? "不限期限" : "限制最长时间" }}
              </div>
              <el-radio-group v-else v-model="durationMode">
                <el-radio value="LIMITED">限制最长时间</el-radio>
                <el-radio value="UNLIMITED">不限期限</el-radio>
              </el-radio-group>
              <span class="block w-full text-12px text-[var(--el-text-color-secondary)]"
                >不限期限可分配长期角色；来源委派到期或撤销后，派生授权仍会失效。</span
              >
            </el-form-item>
            <el-form-item v-if="durationMode === 'LIMITED'" label="单次分配最长时间" required>
              <div v-if="readonly">{{ maxDurationLabel }}</div>
              <biz-iam-duration-fields
                v-else
                v-model:max-assignment-duration="maxDuration"
                :show-validity="false"
                show-max-duration
              />
            </el-form-item>
          </in-form>
          <biz-iam-delegation-ceiling-step
            v-else-if="step === 1"
            v-model="ceilings"
            :actions="actions"
            :api="candidatesApi"
            view-only
          />
          <biz-iam-delegation-ceiling-step
            v-else-if="step === 2"
            v-model="ceilings"
            :actions="actions"
            :api="candidatesApi"
            :disabled="readonly"
            v-model:object-selections="objectSelections"
            :selected-api="selectedCandidates"
            :reset-key="selectionKey"
          />
          <div v-else class="max-w-720px flex flex-col gap-20px">
            <div class="flex flex-col gap-8px">
              <div>
                授权管理员：{{
                  administratorName || editing?.record.administratorName || administratorId
                }}
              </div>
              <div>允许接收的成员：{{ recipientSummary }}</div>
              <div>固定角色版本：{{ revisionOptions.map((item) => item.name).join("、") }}</div>
              <div>
                委派有效期：{{ privateFormatInstant(validFrom, "立即生效") }} 至
                {{ privateFormatInstant(validUntil, "长期有效") }}
              </div>
              <div>单次分配最长时间：{{ maxDurationLabel }}</div>
            </div>
            <div class="text-12px text-[var(--el-text-color-secondary)]">
              请先预览委派影响；预览通过后才能保存，委派不会直接增加管理员的业务权限。
            </div>
            <div>
              <div class="mb-8px">
                操作及范围上限（{{ configuredCount }} / {{ actions.length }}）
              </div>
              <biz-iam-delegation-operation-tree
                :actions="actions"
                :ceilings="ceilings"
                show-ceilings
              />
            </div>
            <biz-iam-preview-alert :preview="previewState.preview.value" />
            <div
              v-if="previewState.preview.value?.effectiveResult?.affectedAssignmentIds.length"
              class="text-[var(--el-text-color-secondary)]"
            >
              受影响分配：{{
                previewState.preview.value.effectiveResult.affectedAssignmentIds.join("、")
              }}
            </div>
          </div>
        </div>
      </section>
    </div>
    <template #footer>
      <in-button @in-click="privateClose">关闭</in-button>
      <in-button v-if="editing && !readonly" :loading="loading" @in-click="reloadVersion"
        >刷新记录版本</in-button
      >
      <in-button v-if="step > 0" @in-click="step -= 1">上一步</in-button>
      <in-button v-if="step < 3" type="primary" @in-click="nextStep">下一步</in-button>
      <in-button
        v-if="step === 3 && !readonly"
        :disabled="saving"
        :loading="previewState.loading.value"
        @in-click="runPreview"
        >预览影响</in-button
      >
      <in-button
        v-if="step === 3 && !readonly && previewState.preview.value?.valid === true"
        type="primary"
        :disabled="!canSubmit"
        :loading="saving"
        @in-click="submit"
        >{{ editing ? "保存" : "创建委派" }}</in-button
      >
    </template>
  </in-drawer>
</template>
<script setup lang="ts">
import {
  confirmUnsavedChanges,
  Message,
  objectActionAllowed,
  useCapabilities,
  type R,
} from "@ingot/admin-core";
import { useIamDraftPreview } from "../hooks/useIamDraftPreview";
import { iamEditorFailure } from "../hooks/iamEditorFailure";
import { delegationPeriodError } from "../models/iam/delegationPeriod";
import { durationHours } from "../models/iam/duration";
import BizIamDelegationCandidatePicker from "./BizIamDelegationCandidatePicker.vue";
import BizIamDelegationRolePicker from "./BizIamDelegationRolePicker.vue";
import BizIamDelegationCeilingStep from "./BizIamDelegationCeilingStep.vue";
import BizIamDelegationOperationTree from "./BizIamDelegationOperationTree.vue";
import BizIamDurationFields from "./BizIamDurationFields.vue";
import BizIamPreviewAlert from "./BizIamPreviewAlert.vue";
import BizIamWizardNav from "./BizIamWizardNav.vue";
import {
  IamAction,
  IAM_DEFAULT_PAGE_SIZE,
  ScopeKind,
  type AuthorizationCandidatesApi,
  type DelegationSelectedCandidatesApi,
  type AuthorizationRoleCandidatesApi,
  type AuthorizationOption,
  type IamSelectOption,
  type DelegationRecord,
  type DelegationInput,
  type DelegationUpdateInput,
  type ResourceDetail,
  type CreatedResource,
  type Preview,
  type ReferenceImpactPreview,
  type ActionScopeCeiling,
} from "../models/iam";
defineOptions({ name: "BizIamPlatformDelegationDrawer" });
const WIZARD_STEPS = [
  { title: "委派信息", description: "选择管理员、角色与接收成员" },
  { title: "确认操作", description: "核对固定版本的完整操作" },
  { title: "设置范围", description: "逐操作配置委派上限" },
  { title: "预览影响", description: "核对配置并预览后保存" },
] as const;
const props = defineProps<{
  candidatesApi: AuthorizationCandidatesApi;
  roleCandidatesApi: AuthorizationRoleCandidatesApi;
  selectedCandidatesApi: DelegationSelectedCandidatesApi;
  getApi: (id: string) => Promise<R<ResourceDetail<DelegationRecord>>>;
  createApi: (input: DelegationInput) => Promise<R<CreatedResource>>;
  updateApi: (
    id: string,
    input: DelegationUpdateInput,
  ) => Promise<R<ResourceDetail<DelegationRecord>>>;
  previewApi: (
    id: string,
    input: DelegationUpdateInput,
  ) => Promise<R<Preview<ReferenceImpactPreview>>>;
  createPreviewApi: (input: DelegationInput) => Promise<R<Preview<ReferenceImpactPreview>>>;
}>();
const emits = defineEmits<{ success: [] }>();
const { hasAction, contextEpoch } = useCapabilities();
const visible = ref(false);
const loading = ref(false);
const saving = ref(false);
const step = ref(0);
const editing = ref<ResourceDetail<DelegationRecord>>();
const readonly = computed(() =>
  editing.value
    ? !objectActionAllowed(editing.value.capabilities, IamAction.PLATFORM_DELEGATION_UPDATE).allowed
    : !hasAction(IamAction.PLATFORM_DELEGATION_CREATE),
);
const administratorId = ref("");
const administratorName = ref("");
const revisionOptions = ref<AuthorizationOption[]>([]);
const unavailableRevisionIds = ref<string[]>([]);
const revisionIds = computed(() => revisionOptions.value.map((option) => option.id));
const recipientIds = ref<string[]>([]);
const recipientNames = ref<string[]>([]);
const recipientOptions = ref<AuthorizationOption[]>([]);
const administratorOptions = ref<AuthorizationOption[]>([]);
const objectSelections = ref<Record<string, AuthorizationOption[]>>({});
const selectedCandidates = computed<AuthorizationCandidatesApi | undefined>(() =>
  editing.value
    ? (query) => props.selectedCandidatesApi(editing.value!.record.id, query)
    : undefined,
);
const durationMode = ref<"LIMITED" | "UNLIMITED">("LIMITED");
const ceilings = ref<Record<string, ActionScopeCeiling>>({});
const openingKey = ref(0);
const selectionKey = computed(() => `${openingKey.value}:${contextEpoch.value}`);
const validFrom = ref<string>();
const validUntil = ref<string>();
const maxDuration = ref<string>("P30D");
const maxDurationLabel = computed(() => {
  if (durationMode.value === "UNLIMITED") return "不限期限（随来源委派失效）";
  const hours = durationHours(maxDuration.value);
  if (!Number.isFinite(hours) || hours <= 0) return "未设置";
  return hours >= 24 ? `${Number((hours / 24).toFixed(3))} 天` : `${Number(hours.toFixed(3))} 小时`;
});
const privateFormatInstant = (value: string | undefined, fallback: string): string =>
  value ? new Date(value).toLocaleString() : fallback;
const initialDraftSignature = ref("");
const recipientSummary = computed(() =>
  recipientNames.value.length === recipientIds.value.length
    ? recipientNames.value.length <= 5
      ? recipientNames.value.join("、")
      : `${recipientNames.value.slice(0, 5).join("、")} 等 ${recipientIds.value.length} 人`
    : `${recipientIds.value.length} 人`,
);
const privateOnAdministratorSelection = (items: IamSelectOption[]): void => {
  administratorName.value = items[0]?.name || "";
  administratorOptions.value = items.map((item) => ({ ...item }));
};
const privateOnRecipientSelection = (items: IamSelectOption[]): void => {
  recipientNames.value = items.map((item) => item.name);
  recipientOptions.value = items.map((item) => ({ ...item }));
};
watch(administratorId, (id, oldId) => {
  if (loading.value || !id || id === oldId || !recipientIds.value.includes(id)) return;
  recipientIds.value = recipientIds.value.filter((value) => value !== id);
  recipientOptions.value = recipientOptions.value.filter((item) => item.id !== id);
  recipientNames.value = recipientOptions.value.map((item) => item.name);
  Message.success("已从允许接收的成员中移除授权管理员本人");
});
const actions = computed(() => [
  ...new Map(
    revisionOptions.value
      .flatMap((option) => option.actions || [])
      .map((action) => [action.id, action]),
  ).values(),
]);
const configuredCount = computed(
  () =>
    actions.value.filter((action) => {
      const ceiling = ceilings.value[action.id];
      return (
        !!ceiling?.scopes.length &&
        (!ceiling.scopes.some((scope) => scope.kind === ScopeKind.OBJECT_SET) ||
          Object.values(ceiling.scopeBindings).some((binding) => binding.ids.length > 0))
      );
    }).length,
);
const nextStep = (): void => {
  if (readonly.value) {
    step.value = Math.min(step.value + 1, WIZARD_STEPS.length - 1);
    return;
  }
  if (
    step.value === 0 &&
    (!administratorId.value || !revisionIds.value.length || !recipientIds.value.length)
  ) {
    Message.warning("请选择授权管理员、固定角色版本和允许接收的成员");
    return;
  }
  if (
    step.value === 0 &&
    (unavailableRevisionIds.value.length ||
      draft.value.allowedRoleRevisionRefs.length !== revisionIds.value.length)
  ) {
    Message.warning("部分角色版本不可用，请重新选择");
    return;
  }
  if (step.value === 0) {
    const issue = delegationPeriodError(
      validFrom.value,
      validUntil.value,
      maxDuration.value,
      durationMode.value,
    );
    if (issue) {
      Message.warning(issue);
      return;
    }
  }
  if (step.value === 1 && !actions.value.length) {
    Message.warning("所选角色版本没有可委派的操作");
    return;
  }
  if (step.value === 2 && configuredCount.value !== actions.value.length) {
    Message.warning("请为每个操作配置范围上限");
    return;
  }
  step.value += 1;
};
const draft = computed<DelegationInput>(() => ({
  administratorMemberId: administratorId.value,
  allowedRoleRevisionRefs: revisionOptions.value.flatMap((option) =>
    option.roleRevisionRef ? [option.roleRevisionRef] : [],
  ),
  recipientSelection: { members: recipientIds.value, departments: [] },
  actionScopeCeilings: actions.value.map((action) => ceilings.value[action.id]),
  validFrom: validFrom.value,
  validUntil: validUntil.value,
  assignmentDurationMode: durationMode.value,
  maxAssignmentDuration: durationMode.value === "LIMITED" ? maxDuration.value : undefined,
}));
const dirty = computed(() => JSON.stringify(draft.value) !== initialDraftSignature.value);
const privateOnBeforeClose = (done: () => void): void => {
  if (!dirty.value || loading.value) {
    done();
    return;
  }
  void confirmUnsavedChanges().then((allowed) => {
    if (allowed) done();
  });
};
const privateClose = (): void => {
  privateOnBeforeClose(() => {
    visible.value = false;
  });
};
const previewState = useIamDraftPreview<DelegationInput, ReferenceImpactPreview>({
  contextEpoch: () => `${contextEpoch.value}:${editing.value?.version || "0"}`,
  preview: async (input) =>
    (editing.value
      ? await props.previewApi(editing.value.record.id, {
          expectedVersion: editing.value.version,
          delegation: input,
        })
      : await props.createPreviewApi(input)
    ).data,
});
watch(draft, previewState.bumpDraft, { deep: true });
watch(contextEpoch, previewState.bumpDraft);
const canSubmit = computed(
  () =>
    !unavailableRevisionIds.value.length &&
    previewState.preview.value?.valid === true &&
    !saving.value,
);
watch(actions, (values) => {
  if (loading.value) return;
  const next: Record<string, ActionScopeCeiling> = {};
  values.forEach((action) => {
    next[action.id] = ceilings.value[action.id] || {
      actionId: action.id,
      scopes: action.scopeCapabilities.includes(ScopeKind.ALL) ? [{ kind: ScopeKind.ALL }] : [],
      scopeBindings: {},
    };
  });
  ceilings.value = next;
});
const reloadVersion = async (): Promise<void> => {
  if (!editing.value || loading.value) return;
  loading.value = true;
  const epoch = opening;
  try {
    const response = await props.getApi(editing.value.record.id);
    if (epoch !== opening || !editing.value) return;
    editing.value = {
      ...editing.value,
      version: response.data.version,
      capabilities: response.data.capabilities,
    };
    previewState.bumpDraft();
    Message.success("已刷新记录版本，草稿已保留，请重新预览");
  } catch (error) {
    await iamEditorFailure(error);
  } finally {
    if (epoch === opening) loading.value = false;
  }
};
const runPreview = async (): Promise<void> => {
  const issue = delegationPeriodError(
    validFrom.value,
    validUntil.value,
    maxDuration.value,
    durationMode.value,
  );
  if (issue) {
    Message.warning(issue);
    return;
  }
  if (unavailableRevisionIds.value.length) {
    Message.warning("部分原有角色版本已不可用，请重新确认角色版本");
    return;
  }
  if (
    !administratorId.value ||
    !revisionIds.value.length ||
    draft.value.allowedRoleRevisionRefs.length !== revisionIds.value.length
  ) {
    Message.warning("请选择管理员与固定角色版本");
    return;
  }
  try {
    await previewState.runPreview(draft.value);
  } catch (error) {
    await iamEditorFailure(error);
  }
};
const submit = async (): Promise<void> => {
  if (!canSubmit.value || saving.value || readonly.value) return;
  const issue = delegationPeriodError(
    validFrom.value,
    validUntil.value,
    maxDuration.value,
    durationMode.value,
  );
  if (issue) {
    Message.warning(issue);
    return;
  }
  saving.value = true;
  try {
    if (editing.value)
      await props.updateApi(editing.value.record.id, {
        expectedVersion: editing.value.version,
        delegation: draft.value,
      });
    else await props.createApi(draft.value);
    Message.success("已保存委派");
    visible.value = false;
    emits("success");
  } catch (error) {
    previewState.bumpDraft();
    await iamEditorFailure(error);
  } finally {
    saving.value = false;
  }
};
let opening = 0;
defineExpose({
  async show(row?: ResourceDetail<DelegationRecord>) {
    const epoch = ++opening;
    openingKey.value += 1;
    step.value = 0;
    visible.value = true;
    loading.value = true;
    editing.value = undefined;
    administratorId.value = "";
    administratorName.value = "";
    revisionOptions.value = [];
    unavailableRevisionIds.value = [];
    recipientIds.value = [];
    recipientNames.value = [];
    recipientOptions.value = [];
    administratorOptions.value = [];
    objectSelections.value = {};
    durationMode.value = "LIMITED";
    ceilings.value = {};
    validFrom.value = undefined;
    validUntil.value = undefined;
    maxDuration.value = "P30D";
    initialDraftSignature.value = JSON.stringify(draft.value);
    previewState.bumpDraft();
    try {
      if (row) {
        const response = await props.getApi(row.record.id);
        if (epoch !== opening) return;
        editing.value = response.data;
        const input = response.data.record.delegation;
        administratorId.value = input.administratorMemberId;
        administratorName.value = response.data.record.administratorName || "";
        administratorOptions.value = administratorName.value
          ? [{ id: input.administratorMemberId, name: administratorName.value }]
          : [];
        const selectedIds = input.allowedRoleRevisionRefs.map((ref) => ref.id);
        recipientIds.value = [...input.recipientSelection.members];
        const options: AuthorizationOption[] = [];
        let selectedPage = 1;
        do {
          const revisionResponse = await props.selectedCandidatesApi(row.record.id, {
            kind: "ROLE_REVISION",
            page: selectedPage,
            pageSize: IAM_DEFAULT_PAGE_SIZE,
          });
          if (epoch !== opening) return;
          options.push(...revisionResponse.data.items);
          if (selectedPage * IAM_DEFAULT_PAGE_SIZE >= revisionResponse.data.total) break;
          selectedPage += 1;
        } while (true);
        revisionOptions.value = selectedIds.flatMap(
          (id) => options.find((option) => option.id === id) || [],
        );
        unavailableRevisionIds.value = selectedIds.filter(
          (id) => !revisionOptions.value.some((option) => option.id === id),
        );
        await nextTick();
        ceilings.value = Object.fromEntries(
          input.actionScopeCeilings.map((value) => [
            value.actionId,
            {
              ...value,
              scopes: value.scopes.map((scope) => ({ ...scope })),
              scopeBindings: Object.fromEntries(
                Object.entries(value.scopeBindings).map(([key, binding]) => [
                  key,
                  { ...binding, ids: [...binding.ids] },
                ]),
              ),
            },
          ]),
        );
        validFrom.value = input.validFrom;
        validUntil.value = input.validUntil;
        durationMode.value = input.assignmentDurationMode || "LIMITED";
        maxDuration.value = input.maxAssignmentDuration || "P30D";
        initialDraftSignature.value = JSON.stringify(draft.value);
      }
    } catch (error) {
      await iamEditorFailure(error);
    } finally {
      if (epoch === opening) loading.value = false;
    }
  },
});
watch(visible, (value) => {
  if (!value) {
    opening += 1;
    previewState.bumpDraft();
  }
});
</script>

<style lang="postcss" scoped>
@media (max-width: 700px) {
  .delegation-wizard-content {
    padding: 16px;
  }
}
</style>
