<template>
  <in-drawer
    v-model="visible"
    :title="editing ? '授权管理员详情' : '创建委派'"
    :loading="loading"
    size="760px"
  >
    <el-alert
      class="mb-12px"
      type="info"
      :closable="false"
      title="委派只提供限定的角色分配能力，不授予业务权限或二次委派资格。收窄存在冲突时请先调整或撤销分配。"
    />
    <in-form label-position="top">
      <el-form-item label="授权管理员" required>
        <biz-iam-authorization-select
          v-model="administratorId"
          :api="candidatesApi"
          :query="{ kind: 'MEMBER' }"
          :disabled="readonly"
        />
      </el-form-item>
      <el-form-item label="允许分配的固定角色版本" required>
        <biz-iam-authorization-select
          v-model="revisionIds"
          :api="candidatesApi"
          :query="{ kind: 'ROLE_REVISION' }"
          multiple
          :disabled="readonly"
          @options="cacheRevisions"
        />
      </el-form-item>
      <el-form-item label="允许接收的成员" required>
        <biz-iam-authorization-select
          v-model="recipientIds"
          :api="candidatesApi"
          :query="{ kind: 'MEMBER' }"
          multiple
          :disabled="readonly"
        />
      </el-form-item>
      <el-form-item label="逐操作范围上限" required>
        <div class="flex flex-col gap-12px w-full">
          <div
            v-for="action in actions"
            :key="action.id"
            class="flex flex-col gap-8px p-12px border border-solid border-[var(--el-border-color-lighter)] rounded-8px"
          >
            <div class="font-medium">
              {{ action.applicationName }} → {{ action.resourceName }} → {{ action.name }}
            </div>
            <el-select
              :model-value="scopeKinds(action.id)"
              multiple
              :disabled="readonly"
              placeholder="选择允许范围"
              @change="(values: ScopeKind[]) => setScopes(action, values)"
            >
              <el-option
                v-for="kind in availableScopes(action)"
                :key="kind"
                :value="kind"
                :label="scopeLabel(kind)"
              />
            </el-select>
            <biz-iam-authorization-select
              v-if="scopeKinds(action.id).includes(ScopeKind.OBJECT_SET)"
              :model-value="objectIds(action.id)"
              :api="candidatesApi"
              :query="{ kind: 'OBJECT', actionId: action.id }"
              multiple
              :disabled="readonly"
              placeholder="指定本资源的范围对象"
              @update:model-value="(value) => setObjects(action, value)"
            />
            <in-button
              v-if="!readonly && scopeKinds(action.id).includes(ScopeKind.OBJECT_SET)"
              @click="reuseObjects(action)"
              >复用于本资源其他操作</in-button
            >
          </div>
          <span v-if="!actions.length" class="text-[var(--el-text-color-secondary)]"
            >选择固定角色版本后配置其全部操作</span
          >
        </div>
      </el-form-item>
      <el-form-item label="有效期及单次分配最长期限" required>
        <div v-if="readonly">
          {{ validFrom || "立即" }} 至 {{ validUntil || "长期" }}；最长 {{ maxDuration }}
        </div>
        <biz-iam-duration-fields
          v-else
          v-model:valid-from="validFrom"
          v-model:valid-until="validUntil"
          v-model:max-assignment-duration="maxDuration"
          show-max-duration
        />
      </el-form-item>
      <biz-iam-preview-alert :preview="previewState.preview.value" />
      <div
        v-if="previewState.preview.value?.effectiveResult?.affectedAssignmentIds.length"
        class="text-[var(--el-text-color-secondary)]"
      >
        受影响分配：{{
          previewState.preview.value.effectiveResult.affectedAssignmentIds.join("、")
        }}
      </div>
    </in-form>
    <template #footer>
      <in-button @click="visible = false">关闭</in-button>
      <in-button v-if="editing && !readonly" :loading="loading" @in-click="reloadVersion"
        >刷新记录版本</in-button
      >
      <in-button
        v-if="!readonly"
        :disabled="saving"
        :loading="previewState.loading.value"
        @in-click="runPreview"
        >预览影响</in-button
      >
      <in-button
        v-if="!readonly"
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
import { Message, objectActionAllowed, useCapabilities, type R } from "@ingot/admin-core";
import { useIamDraftPreview } from "../hooks/useIamDraftPreview";
import { iamEditorFailure } from "../hooks/iamEditorFailure";
import BizIamAuthorizationSelect from "./BizIamAuthorizationSelect.vue";
import BizIamDurationFields from "./BizIamDurationFields.vue";
import BizIamPreviewAlert from "./BizIamPreviewAlert.vue";
import {
  ScopeKind,
  ScopeBindingKind,
  IamAction,
  useScopeKindEnum,
  type AuthorizationCandidatesApi,
  type AuthorizationActionOption,
  type AuthorizationOption,
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
const props = defineProps<{
  candidatesApi: AuthorizationCandidatesApi;
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
const editing = ref<ResourceDetail<DelegationRecord>>();
const readonly = computed(() =>
  editing.value
    ? !objectActionAllowed(editing.value.capabilities, IamAction.PLATFORM_DELEGATION_UPDATE).allowed
    : !hasAction(IamAction.PLATFORM_DELEGATION_CREATE),
);
const administratorId = ref("");
const revisionIds = ref<string[]>([]);
const recipientIds = ref<string[]>([]);
const revisions = ref<Record<string, AuthorizationOption>>({});
const ceilings = ref<Record<string, ActionScopeCeiling>>({});
const validFrom = ref<string>();
const validUntil = ref<string>();
const maxDuration = ref<string>("P30D");
const actions = computed(() => [
  ...new Map(
    revisionIds.value
      .flatMap((id) => revisions.value[id]?.actions || [])
      .map((action) => [action.id, action]),
  ).values(),
]);
const draft = computed<DelegationInput>(() => ({
  administratorMemberId: administratorId.value,
  allowedRoleRevisionRefs: revisionIds.value.flatMap((id) =>
    revisions.value[id]?.roleRevisionRef ? [revisions.value[id].roleRevisionRef!] : [],
  ),
  recipientSelection: { members: recipientIds.value, departments: [] },
  actionScopeCeilings: actions.value.map((action) => ceilings.value[action.id]),
  validFrom: validFrom.value,
  validUntil: validUntil.value,
  maxAssignmentDuration: maxDuration.value || "",
}));
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
const canSubmit = computed(() => previewState.preview.value?.valid === true && !saving.value);
const cacheRevisions = (options: AuthorizationOption[]): void => {
  options.forEach((option) => {
    revisions.value[option.id] = option;
  });
};
watch(actions, (values) => {
  if (loading.value || revisionIds.value.some((id) => !revisions.value[id])) return;
  const next: Record<string, ActionScopeCeiling> = {};
  values.forEach((action) => {
    next[action.id] = ceilings.value[action.id] || {
      actionId: action.id,
      scopes: [],
      scopeBindings: {},
    };
  });
  ceilings.value = next;
});
const kindEnum = useScopeKindEnum();
const scopeLabel = (kind: ScopeKind): string => kindEnum.getTagText(kind).text;
const availableScopes = (action: AuthorizationActionOption): ScopeKind[] =>
  action.scopeCapabilities.filter(
    (kind) => kind !== ScopeKind.MEMBER_DEPARTMENTS && kind !== ScopeKind.MANAGED_DEPARTMENTS,
  );
const scopeKinds = (id: string): ScopeKind[] =>
  ceilings.value[id]?.scopes.map((scope) => scope.kind) || [];
const objectKey = (action: AuthorizationActionOption): string => `objects_${action.resourceId}`;
const setScopes = (action: AuthorizationActionOption, values: ScopeKind[]): void => {
  const key = objectKey(action);
  const old = ceilings.value[action.id];
  ceilings.value[action.id] = {
    actionId: action.id,
    scopes: values.map((kind) =>
      kind === ScopeKind.OBJECT_SET ? { kind, parameterKey: key } : { kind },
    ),
    scopeBindings: values.includes(ScopeKind.OBJECT_SET)
      ? { [key]: old?.scopeBindings[key] || { kind: ScopeBindingKind.OBJECTS, ids: [] } }
      : {},
  };
};
const objectIds = (id: string): string[] =>
  Object.values(ceilings.value[id]?.scopeBindings || {}).flatMap((binding) => binding.ids);
const setObjects = (action: AuthorizationActionOption, value: string | string[]): void => {
  ceilings.value[action.id].scopeBindings = {
    [objectKey(action)]: { kind: ScopeBindingKind.OBJECTS, ids: Array.isArray(value) ? value : [] },
  };
};
const reuseObjects = (action: AuthorizationActionOption): void => {
  actions.value
    .filter(
      (value) =>
        value.resourceId === action.resourceId &&
        scopeKinds(value.id).includes(ScopeKind.OBJECT_SET),
    )
    .forEach((value) => setObjects(value, [...objectIds(action.id)]));
};
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
    visible.value = true;
    loading.value = true;
    editing.value = undefined;
    administratorId.value = "";
    revisionIds.value = [];
    recipientIds.value = [];
    ceilings.value = {};
    revisions.value = {};
    validFrom.value = undefined;
    validUntil.value = undefined;
    maxDuration.value = "P30D";
    previewState.bumpDraft();
    try {
      if (row) {
        const response = await props.getApi(row.record.id);
        if (epoch !== opening) return;
        editing.value = response.data;
        const input = response.data.record.delegation;
        administratorId.value = input.administratorMemberId;
        revisionIds.value = input.allowedRoleRevisionRefs.map((ref) => ref.id);
        recipientIds.value = [...input.recipientSelection.members];
        for (let offset = 0; offset < revisionIds.value.length; offset += 20) {
          const revisionResponse = await props.candidatesApi({
            kind: "ROLE_REVISION",
            ids: revisionIds.value.slice(offset, offset + 20),
            pageSize: 20,
          });
          if (epoch !== opening) return;
          cacheRevisions(revisionResponse.data.items);
        }
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
        maxDuration.value = input.maxAssignmentDuration;
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
