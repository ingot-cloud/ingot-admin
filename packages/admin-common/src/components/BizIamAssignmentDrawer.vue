<template>
  <in-drawer v-model="visible" :title="title" :loading="loading" size="720px">
    <el-form label-position="top">
      <el-form-item label="接收对象" required>
        <el-select v-model="subjectType" :disabled="isEditing" class="w-160px mb-8px">
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
            <div>{{ key }}（{{ bindingKindLabel(scopeBindings[key]?.kind) }}）</div>
            <biz-iam-chip-page-select
              v-if="scopeBindings[key]?.kind === ScopeBindingKind.DEPARTMENTS && loadDepartments"
              :model-value="scopeBindings[key]?.ids ?? []"
              :load-data="loadDepartments"
              placeholder="远程分页添加管理部门"
              empty-text="未指定部门"
              @update:model-value="(value) => privateSetBindingIds(key, value)"
            />
            <div v-else class="flex flex-col gap-8px">
              <div class="flex flex-wrap gap-8px">
                <el-tag
                  v-for="id in scopeBindings[key]?.ids ?? []"
                  :key="id"
                  closable
                  @close="privateRemoveBindingId(key, id)"
                >
                  {{ id }}
                </el-tag>
                <span
                  v-if="!(scopeBindings[key]?.ids ?? []).length"
                  class="text-[var(--el-text-color-secondary)]"
                >
                  未指定对象
                </span>
              </div>
              <el-input
                v-model="objectPick[key]"
                placeholder="输入对象 ID 后回车添加"
                @keyup.enter="privateAddBindingId(key)"
              />
            </div>
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
    </el-form>
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
} from "../models/iam";

defineOptions({ name: "BizIamAssignmentDrawer" });

const props = defineProps<{
  loadMembers: (params: LoadDataParams) => Promise<Page<IamSelectOption>>;
  loadGroups: (params: LoadDataParams) => Promise<Page<IamSelectOption>>;
  loadRoles: (params: LoadDataParams) => Promise<Page<IamSelectOption>>;
  listRevisionsApi: (id: string, page: Page) => Promise<R<Page<ResourceDetail<RoleRevision>>>>;
  loadDepartments?: (params: LoadDataParams) => Promise<Page<IamSelectOption>>;
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
const objectPick = reactive<Record<string, string>>({});
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
    revisionOptions.value = (response.data.records ?? []).map((item) => ({
      id: item.record.id,
      kind: item.record.kind,
      label: `版本 ${item.record.revision}（${item.record.id}）`,
    }));
  });
};

const privateOnRevisionChange = (id: string): void => {
  const selected = revisionOptions.value.find((item) => item.id === id);
  if (selected) {
    revisionKind.value = selected.kind;
  }
  if (!roleId.value || !id) {
    return;
  }
  props.listRevisionsApi(roleId.value, { current: 1, size: 50 }).then((response) => {
    const revision = (response.data.records ?? []).find((item) => item.record.id === id);
    resetBindings(revision);
  });
};

const privateSetBindingIds = (key: string, ids: string[]): void => {
  const current = scopeBindings[key];
  if (!current) {
    return;
  }
  scopeBindings[key] = { ...current, ids };
};

const privateAddBindingId = (key: string): void => {
  const value = objectPick[key]?.trim();
  const current = scopeBindings[key];
  if (!value || !current || current.ids.includes(value)) {
    objectPick[key] = "";
    return;
  }
  scopeBindings[key] = { ...current, ids: [...current.ids, value] };
  objectPick[key] = "";
};

const privateRemoveBindingId = (key: string, id: string): void => {
  const current = scopeBindings[key];
  if (!current) {
    return;
  }
  scopeBindings[key] = { ...current, ids: current.ids.filter((item) => item !== id) };
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
