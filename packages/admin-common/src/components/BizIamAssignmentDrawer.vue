<template>
  <in-drawer v-model="visible" :title="title" :loading="loading" size="720px">
    <in-form label-position="top">
      <el-form-item label="接收对象" required>
        <el-select
          v-model="subjectType"
          :disabled="isEditing"
          class="w-160px mb-8px"
          placeholder="请选择对象类型"
        >
          <el-option
            v-for="option in subjectOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
        <biz-iam-chip-page-select
          v-if="!isEditing"
          v-model="subjectIds"
          :load-data="subjectLoader"
          :placeholder="subjectType === SubjectType.GROUP ? '远程分页添加用户组' : '远程分页添加成员'"
          empty-text="未选择接收对象"
        />
        <div v-else class="text-[var(--el-text-color-secondary)]">
          {{ subjectType }} / {{ subjectIds[0] }}
        </div>
      </el-form-item>
      <el-form-item label="角色" required>
        <in-page-select
          v-model="roleId"
          filterable
          remote
          clearable
          value-field="id"
          label-field="name"
          placeholder="远程分页选择角色"
          :disabled="isEditing"
          :load-data="loadRoles"
          @change="privateOnRoleChange"
        />
      </el-form-item>
      <el-form-item label="角色版本" required>
        <el-select v-model="revisionId" placeholder="固定版本" class="w-full" @change="privateOnRevisionChange">
          <el-option
            v-for="item in revisionOptions"
            :key="item.id"
            :label="item.label"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item v-if="bindingKeys.length" label="范围参数">
        <div class="flex flex-col gap-12px">
          <div v-for="key in bindingKeys" :key="key" class="flex flex-col gap-4px">
            <div>{{ bindingLabels[key] ? `${bindingLabels[key]} · ` : "" }}{{ bindingKindLabel(scopeBindings[key]?.kind) }}{{ bindingKeys.length > 1 ? ` ${bindingKeys.indexOf(key) + 1}` : "" }}</div>
            <biz-iam-delegation-candidate-picker
              v-if="scopeCandidatesApi"
              :model-value="scopeBindings[key]?.ids ?? []"
              :api="scopeCandidatesApi"
              :query="{ kind: 'OBJECT', revisionId, parameterKey: key }"
              multiple
              :title="`选择${bindingKindLabel(scopeBindings[key]?.kind)}`"
              :placeholder="`请选择${bindingKindLabel(scopeBindings[key]?.kind)}`"
              :search-placeholder="`搜索${bindingKindLabel(scopeBindings[key]?.kind)}`"
              @update:model-value="(value) => privateSetBindingIds(key, value)"
            />
            <span v-else class="text-[var(--el-color-warning)]">范围候选暂不可用</span>
          </div>
        </div>
      </el-form-item>
      <el-form-item label="有效期">
        <biz-iam-duration-fields v-model:valid-from="validFrom" v-model:valid-until="validUntil" />
      </el-form-item>
      <el-form-item label="来源委派 ID">
        <el-input
          v-model="delegationGrantId"
          :disabled="isEditing"
          placeholder="治理直接分配可空；提交时由服务端重验来源"
        />
      </el-form-item>
      <biz-iam-preview-alert :preview="previewState.preview.value" />
      <div v-if="previewItems.length" class="flex flex-col gap-4px text-12px">
        <div v-for="(item, index) in previewItems" :key="`${item.subject.id}-${index}`">
          {{ item.subject.type }}/{{ item.subject.id }}：{{ item.allowed ? "可提交" : "不可提交" }}
          <span v-if="item.errors.length">
            （{{ item.errors.map((entry) => entry.message).join("；") }}）
          </span>
        </div>
      </div>
    </in-form>
    <template #footer>
      <in-button @click="visible = false">取消</in-button>
      <in-button :loading="previewState.loading.value" @in-click="privatePreview">预览效果</in-button>
      <in-button type="primary" :loading="saving" :disabled="!canSubmit" @in-click="privateSubmit">
        {{ editing ? "保存" : "提交批次" }}
      </in-button>
    </template>
  </in-drawer>
</template>

<script setup lang="ts">
import { Message, type LoadDataParams, type Page, type R } from "@ingot/admin-core";
import { useIamDraftPreview } from "../hooks/useIamDraftPreview";
import BizIamChipPageSelect from "./BizIamChipPageSelect.vue";
import BizIamDelegationCandidatePicker from "./BizIamDelegationCandidatePicker.vue";
import BizIamDurationFields from "./BizIamDurationFields.vue";
import BizIamPreviewAlert from "./BizIamPreviewAlert.vue";
import {
  RoleKind,
  ScopeBindingKind,
  SubjectType,
  toAssignmentBatchItems,
  useScopeBindingKindEnum,
  useSubjectTypeEnum,
  type AssignmentBatchInput,
  type AssignmentInput,
  type AssignmentPreviewResult,
  type AssignmentRecord,
  type AssignmentUpdateInput,
  type CreatedResource,
  type IamSelectOption,
  type Preview,
  type ResourceDetail,
  type RoleRevision,
  type ScopeBinding,
  type AuthorizationCandidatesApi,
} from "../models/iam";

defineOptions({ name: "BizIamAssignmentDrawer" });

const props = defineProps<{
  loadMembers: (params: LoadDataParams) => Promise<Page<IamSelectOption>>;
  loadGroups: (params: LoadDataParams) => Promise<Page<IamSelectOption>>;
  loadRoles: (params: LoadDataParams) => Promise<Page<IamSelectOption>>;
  listRevisionsApi: (id: string, page: Page) => Promise<R<Page<ResourceDetail<RoleRevision>>>>;
  loadDepartments?: (params: LoadDataParams) => Promise<Page<IamSelectOption>>;
  scopeCandidatesApi?: AuthorizationCandidatesApi;
  createApi: (input: AssignmentBatchInput) => Promise<R<CreatedResource>>;
  previewApi: (input: AssignmentBatchInput) => Promise<R<Preview<AssignmentPreviewResult>>>;
  updateApi: (id: string, input: AssignmentUpdateInput) => Promise<R<ResourceDetail<AssignmentRecord>>>;
}>();

const emits = defineEmits<{ success: [] }>();
const visible = ref(false);
const loading = ref(false);
const saving = ref(false);
const editing = ref<ResourceDetail<AssignmentRecord>>();
const isEditing = computed(() => !!editing.value);
const subjectType = ref(SubjectType.MEMBER);
const subjectIds = ref<string[]>([]);
const roleId = ref("");
const revisionId = ref("");
const revisionKind = ref<RoleKind>(RoleKind.TENANT_CUSTOM);
const revisionOptions = ref<Array<{ id: string; label: string; kind: RoleKind }>>([]);
const scopeBindings = reactive<Record<string, ScopeBinding>>({});
const bindingLabels = reactive<Record<string, string>>({});
const validFrom = ref<string>();
const validUntil = ref<string>();
const delegationGrantId = ref("");
const subjectEnum = useSubjectTypeEnum();
const bindingEnum = useScopeBindingKindEnum();
const subjectOptions = subjectEnum.getOptions();
const contextEpoch = computed(() => editing.value?.version ?? "0");

const subjectLoader = (params: LoadDataParams): Promise<Page<IamSelectOption>> =>
  subjectType.value === SubjectType.GROUP ? props.loadGroups(params) : props.loadMembers(params);

const title = computed(() => (editing.value ? "修改授权" : "分配授权"));
const bindingKeys = computed(() => Object.keys(scopeBindings));
let bindingLabelEpoch = 0;
watch([revisionId, bindingKeys], ([revision, keys]) => {
  const epoch = ++bindingLabelEpoch;
  Object.keys(bindingLabels).forEach((key) => delete bindingLabels[key]);
  const api = props.scopeCandidatesApi;
  if (!revision || !api) return;
  keys.forEach((key) => {
    void api({ kind: "OBJECT", revisionId: revision, parameterKey: key,
      page: 1, pageSize: 1 }).then((response) => {
      if (epoch === bindingLabelEpoch && response.data.contextLabel) {
        bindingLabels[key] = response.data.contextLabel;
      }
    }).catch(() => {
      // 对象选择器会展示可重试的实际候选错误；标签保留业务类型文案。
    });
  });
});
const previewState = useIamDraftPreview<AssignmentBatchInput, AssignmentPreviewResult>({
  contextEpoch,
  preview: async (draft) => {
    const response = await props.previewApi(draft);
    return response.data;
  },
});
const previewItems = computed(() => previewState.preview.value?.effectiveResult?.items ?? []);
const canSubmit = computed(() => previewState.preview.value?.valid === true);

const assignmentDraft = computed<AssignmentBatchInput>(() => ({
  items: toAssignmentBatchItems(subjectType.value, subjectIds.value, {
    roleRevisionRef: { kind: revisionKind.value, id: revisionId.value },
    scopeBindings: { ...scopeBindings },
    validFrom: validFrom.value || undefined,
    validUntil: validUntil.value || undefined,
    delegationGrantId: delegationGrantId.value.trim() || undefined,
  }),
}));

watch(
  assignmentDraft,
  () => {
    previewState.bumpDraft();
  },
  { deep: true },
);

const bindingKindLabel = (kind?: ScopeBindingKind): string =>
  kind ? bindingEnum.getTagText(kind).text : "未声明";

const resetBindings = (revision?: ResourceDetail<RoleRevision>): void => {
  Object.keys(scopeBindings).forEach((key) => {
    delete scopeBindings[key];
  });
  for (const item of revision?.record.parameterDefinitions ?? []) {
    scopeBindings[item.key] = { kind: item.kind, ids: [] };
  }
};

const applyAssignment = (input: AssignmentInput): void => {
  subjectType.value = input.subject.type;
  subjectIds.value = [input.subject.id];
  revisionId.value = input.roleRevisionRef.id;
  revisionKind.value = input.roleRevisionRef.kind;
  roleId.value = "";
  Object.keys(scopeBindings).forEach((key) => {
    delete scopeBindings[key];
  });
  for (const [key, binding] of Object.entries(input.scopeBindings)) {
    scopeBindings[key] = { kind: binding.kind, ids: [...binding.ids] };
  }
  validFrom.value = input.validFrom;
  validUntil.value = input.validUntil;
  delegationGrantId.value = input.delegationGrantId ?? "";
};

const privateOnRoleChange = (id: string): void => {
  revisionId.value = "";
  revisionOptions.value = [];
  resetBindings();
  if (!id) {
    return;
  }
  props.listRevisionsApi(id, { current: 1, size: 50 }).then((response) => {
    if (id !== roleId.value || !visible.value) return;
    revisionOptions.value = (response.data.records ?? []).map((item) => ({
      id: item.record.id,
      kind: item.record.kind,
      label: `版本 ${item.record.revision}（${item.record.id}）`,
    }));
  });
};

const privateOnRevisionChange = (id: string): void => {
  resetBindings();
  const selected = revisionOptions.value.find((item) => item.id === id);
  if (selected) {
    revisionKind.value = selected.kind;
  }
  if (!roleId.value || !id) {
    return;
  }
  const selectedRoleId = roleId.value;
  props.listRevisionsApi(selectedRoleId, { current: 1, size: 50 }).then((response) => {
    if (revisionId.value !== id || roleId.value !== selectedRoleId || !visible.value) return;
    const revision = (response.data.records ?? []).find((item) => item.record.id === id);
    resetBindings(revision);
  });
};

const privateSetBindingIds = (key: string, ids: string | string[]): void => {
  const current = scopeBindings[key];
  if (!current) {
    return;
  }
  scopeBindings[key] = { ...current, ids: Array.isArray(ids) ? ids : [] };
};

const privatePreview = (): void => {
  if (!assignmentDraft.value.items.length || !revisionId.value) {
    Message.warning("请选择接收对象和角色版本后再预览");
    return;
  }
  void previewState.runPreview(assignmentDraft.value);
};

const privateSubmit = (): void => {
  if (!canSubmit.value) {
    Message.warning("请先预览且批次全部通过后再提交；任一项失败都不会保存");
    return;
  }
  const items = assignmentDraft.value.items;
  saving.value = true;
  const request = editing.value
    ? props.updateApi(editing.value.record.id, {
        expectedVersion: editing.value.version,
        assignment: items[0],
      })
    : props.createApi({ items });
  request
    .then(() => {
      Message.success(editing.value ? "已保存授权" : "已提交授权批次");
      visible.value = false;
      emits("success");
    })
    .finally(() => {
      saving.value = false;
    });
};

const reset = (): void => {
  editing.value = undefined;
  subjectType.value = SubjectType.MEMBER;
  subjectIds.value = [];
  roleId.value = "";
  revisionId.value = "";
  revisionKind.value = RoleKind.TENANT_CUSTOM;
  revisionOptions.value = [];
  resetBindings();
  validFrom.value = undefined;
  validUntil.value = undefined;
  delegationGrantId.value = "";
  previewState.bumpDraft();
};

defineExpose({
  show(row?: ResourceDetail<AssignmentRecord>) {
    reset();
    visible.value = true;
    if (!row) {
      return;
    }
    editing.value = row;
    applyAssignment(row.record.assignment);
    revisionOptions.value = [
      {
        id: row.record.assignment.roleRevisionRef.id,
        kind: row.record.assignment.roleRevisionRef.kind,
        label: row.record.assignment.roleRevisionRef.id,
      },
    ];
  },
});
</script>
