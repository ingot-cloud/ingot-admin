<template>
  <in-drawer v-model="visible" :title="title" :loading="loading" size="760px">
    <el-alert
      class="mb-12px"
      type="info"
      :closable="false"
      title="允许给别人授权，不自动获得业务操作权。无二次委派。"
    />
    <in-form label-position="top">
      <el-form-item label="授权管理员" required>
        <in-page-select
          v-model="administratorMemberId"
          filterable
          remote
          clearable
          value-field="id"
          label-field="name"
          placeholder="远程分页选择管理员"
          :load-data="loadMembers"
        />
      </el-form-item>
      <el-form-item label="允许分配的角色版本" required>
        <div class="flex flex-col gap-8px">
          <div class="flex flex-wrap gap-8px">
            <in-page-select
              v-model="rolePick"
              filterable
              remote
              clearable
              value-field="id"
              label-field="name"
              placeholder="选择角色"
              :load-data="loadRoles"
              @change="privateOnRolePick"
            />
            <el-select v-model="revisionPick" placeholder="选择固定版本" class="w-280px">
              <el-option
                v-for="item in revisionOptions"
                :key="item.id"
                :label="item.label"
                :value="item.id"
              />
            </el-select>
            <in-button @in-click="privateAddRevision">加入白名单</in-button>
          </div>
          <div class="flex flex-wrap gap-8px">
            <el-tag
              v-for="item in allowedRoleRevisionRefs"
              :key="`${item.kind}-${item.id}`"
              closable
              @close="privateRemoveRevision(item.id)"
            >
              {{ item.kind }} / {{ item.id }}
            </el-tag>
            <span v-if="!allowedRoleRevisionRefs.length" class="text-[var(--el-text-color-secondary)]">
              新角色版本必须显式加入白名单
            </span>
          </div>
        </div>
      </el-form-item>
      <el-form-item label="允许接收的成员">
        <biz-iam-chip-page-select
          v-model="recipientMembers"
          :load-data="loadMembers"
          placeholder="远程分页添加成员"
          empty-text="未选择成员"
        />
      </el-form-item>
      <el-form-item v-if="loadDepartments" label="允许接收的部门">
        <biz-iam-chip-page-select
          v-model="recipientDepartments"
          :load-data="loadDepartments"
          placeholder="远程分页添加部门"
          empty-text="未选择部门"
        />
        <el-checkbox v-model="includeDescendants">含下级部门</el-checkbox>
      </el-form-item>
      <el-form-item label="逐操作范围上限">
        <div class="flex flex-col gap-12px">
          <div v-for="(item, index) in ceilings" :key="index" class="flex flex-col gap-8px">
            <div class="flex items-center gap-8px">
              <el-input v-model="item.actionId" placeholder="操作 ID" />
              <el-button text type="danger" @click="privateRemoveCeiling(index)">删除</el-button>
            </div>
            <biz-iam-scope-editor v-model="item.scopes" />
          </div>
          <el-button text type="primary" @click="privateAddCeiling">添加操作上限</el-button>
        </div>
      </el-form-item>
      <el-form-item label="期限" required>
        <biz-iam-duration-fields
          v-model:valid-from="validFrom"
          v-model:valid-until="validUntil"
          v-model:max-assignment-duration="maxAssignmentDuration"
          show-max-duration
        />
      </el-form-item>
      <biz-iam-preview-alert v-if="editing" :preview="previewState.preview.value" />
      <div v-if="impact" class="text-12px text-[var(--el-text-color-secondary)] flex flex-col gap-4px">
        <div v-if="impact.impactSummary.affectedAssignments != null">
          可披露受影响授权 {{ impact.impactSummary.affectedAssignments }}
        </div>
        <div v-if="impact.impactSummary.restricted">部分影响当前身份无法披露，不以 0 代替</div>
        <div v-if="impact.affectedAssignmentIds.length">
          受影响授权：{{ impact.affectedAssignmentIds.join("、") }}
        </div>
      </div>
    </in-form>
    <template #footer>
      <in-button @click="visible = false">取消</in-button>
      <in-button
        v-if="editing"
        :loading="previewState.loading.value"
        @in-click="privatePreview"
      >
        预览收缩影响
      </in-button>
      <in-button type="primary" :loading="saving" :disabled="editing ? !canSubmit : false" @in-click="privateSubmit">
        {{ editing ? "保存" : "创建委派" }}
      </in-button>
    </template>
  </in-drawer>
</template>

<script setup lang="ts">
import { Message, type LoadDataParams, type Page, type R } from "@ingot/admin-core";
import { useIamDraftPreview } from "../hooks/useIamDraftPreview";
import {
  RoleKind,
  ScopeKind,
  type CreatedResource,
  type DelegationInput,
  type DelegationRecord,
  type DelegationUpdateInput,
  type IamSelectOption,
  type Preview,
  type ReferenceImpactPreview,
  type ResourceDetail,
  type RoleRevision,
  type RoleRevisionRef,
  type ScopeExpression,
} from "../models/iam";

defineOptions({ name: "BizIamDelegationDrawer" });

interface CeilingDraft {
  actionId: string;
  scopes: ScopeExpression[];
}

const props = defineProps<{
  loadMembers: (params: LoadDataParams) => Promise<Page<IamSelectOption>>;
  loadRoles: (params: LoadDataParams) => Promise<Page<IamSelectOption>>;
  listRevisionsApi: (id: string, page: Page) => Promise<R<Page<ResourceDetail<RoleRevision>>>>;
  loadDepartments?: (params: LoadDataParams) => Promise<Page<IamSelectOption>>;
  createApi: (input: DelegationInput) => Promise<R<CreatedResource>>;
  getApi: (id: string) => Promise<R<ResourceDetail<DelegationRecord>>>;
  updateApi: (id: string, input: DelegationUpdateInput) => Promise<R<ResourceDetail<DelegationRecord>>>;
  previewApi: (id: string, input: DelegationUpdateInput) => Promise<R<Preview<ReferenceImpactPreview>>>;
}>();

const emits = defineEmits<{ success: [] }>();
const visible = ref(false);
const loading = ref(false);
const saving = ref(false);
const editing = ref<ResourceDetail<DelegationRecord>>();
const administratorMemberId = ref("");
const allowedRoleRevisionRefs = ref<RoleRevisionRef[]>([]);
const recipientMembers = ref<string[]>([]);
const recipientDepartments = ref<string[]>([]);
const includeDescendants = ref(true);
const ceilings = ref<CeilingDraft[]>([]);
const validFrom = ref<string>();
const validUntil = ref<string>();
const maxAssignmentDuration = ref("P30D");
const rolePick = ref("");
const revisionPick = ref("");
const revisionOptions = ref<Array<{ id: string; label: string; kind: RoleKind }>>([]);
const contextEpoch = computed(() => editing.value?.version ?? "0");
const title = computed(() => (editing.value ? "调整委派" : "创建委派"));

const delegationDraft = computed<DelegationInput>(() => ({
  administratorMemberId: administratorMemberId.value.trim(),
  allowedRoleRevisionRefs: allowedRoleRevisionRefs.value.map((item) => ({ ...item })),
  recipientSelection: {
    members: [...recipientMembers.value],
    departments: recipientDepartments.value.map((id) => ({
      id,
      includeDescendants: includeDescendants.value,
    })),
  },
  actionScopeCeilings: ceilings.value
    .filter((item) => item.actionId.trim())
    .map((item) => ({
      actionId: item.actionId.trim(),
      scopes: item.scopes,
      scopeBindings: {},
    })),
  validFrom: validFrom.value || undefined,
  validUntil: validUntil.value || undefined,
  maxAssignmentDuration: maxAssignmentDuration.value.trim(),
}));

const updateDraft = computed<DelegationUpdateInput>(() => ({
  expectedVersion: editing.value?.version ?? "",
  delegation: delegationDraft.value,
}));

const previewState = useIamDraftPreview<DelegationUpdateInput, ReferenceImpactPreview>({
  contextEpoch,
  preview: async (draft) => {
    if (!editing.value) {
      return { version: contextEpoch.value, valid: true, errors: [], warnings: [] };
    }
    const response = await props.previewApi(editing.value.record.id, draft);
    return response.data;
  },
});
const impact = computed(() => previewState.preview.value?.effectiveResult);
const canSubmit = computed(() => previewState.preview.value?.valid === true);

watch(
  delegationDraft,
  () => {
    previewState.bumpDraft();
  },
  { deep: true },
);

const privateOnRolePick = (id: string): void => {
  revisionPick.value = "";
  revisionOptions.value = [];
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

const privateAddRevision = (): void => {
  const selected = revisionOptions.value.find((item) => item.id === revisionPick.value);
  if (!selected) {
    Message.warning("请选择要加入白名单的固定版本");
    return;
  }
  if (allowedRoleRevisionRefs.value.some((item) => item.id === selected.id)) {
    return;
  }
  allowedRoleRevisionRefs.value = [
    ...allowedRoleRevisionRefs.value,
    { kind: selected.kind, id: selected.id },
  ];
  revisionPick.value = "";
};

const privateRemoveRevision = (id: string): void => {
  allowedRoleRevisionRefs.value = allowedRoleRevisionRefs.value.filter((item) => item.id !== id);
};

const privateAddCeiling = (): void => {
  ceilings.value = [...ceilings.value, { actionId: "", scopes: [{ kind: ScopeKind.SELF }] }];
};

const privateRemoveCeiling = (index: number): void => {
  ceilings.value = ceilings.value.filter((_, itemIndex) => itemIndex !== index);
};

const applyDelegation = (input: DelegationInput): void => {
  administratorMemberId.value = input.administratorMemberId;
  allowedRoleRevisionRefs.value = input.allowedRoleRevisionRefs.map((item) => ({ ...item }));
  recipientMembers.value = [...input.recipientSelection.members];
  recipientDepartments.value = input.recipientSelection.departments.map((item) => item.id);
  includeDescendants.value = input.recipientSelection.departments.some((item) => item.includeDescendants);
  ceilings.value = input.actionScopeCeilings.map((item) => ({
    actionId: item.actionId,
    scopes: [...item.scopes],
  }));
  validFrom.value = input.validFrom;
  validUntil.value = input.validUntil;
  maxAssignmentDuration.value = input.maxAssignmentDuration || "P30D";
};

const privatePreview = (): void => {
  if (!editing.value) {
    return;
  }
  void previewState.runPreview(updateDraft.value);
};

const privateSubmit = (): void => {
  if (!administratorMemberId.value.trim() || !allowedRoleRevisionRefs.value.length) {
    Message.warning("请选择管理员和至少一个允许分配的角色版本");
    return;
  }
  if (!maxAssignmentDuration.value.trim()) {
    Message.warning("请填写单次分配最长持续时间");
    return;
  }
  if (editing.value && !canSubmit.value) {
    Message.warning("请先预览收缩影响且预览通过后再保存");
    return;
  }
  saving.value = true;
  const request = editing.value
    ? props.updateApi(editing.value.record.id, updateDraft.value)
    : props.createApi(delegationDraft.value);
  request
    .then(() => {
      Message.success(editing.value ? "已保存委派" : "已创建委派");
      visible.value = false;
      emits("success");
    })
    .finally(() => {
      saving.value = false;
    });
};

const reset = (): void => {
  editing.value = undefined;
  administratorMemberId.value = "";
  allowedRoleRevisionRefs.value = [];
  recipientMembers.value = [];
  recipientDepartments.value = [];
  includeDescendants.value = true;
  ceilings.value = [];
  validFrom.value = undefined;
  validUntil.value = undefined;
  maxAssignmentDuration.value = "P30D";
  rolePick.value = "";
  revisionPick.value = "";
  revisionOptions.value = [];
  previewState.bumpDraft();
};

defineExpose({
  show(row?: ResourceDetail<DelegationRecord>) {
    reset();
    visible.value = true;
    if (!row) {
      return;
    }
    loading.value = true;
    props
      .getApi(row.record.id)
      .then((response) => {
        editing.value = response.data;
        applyDelegation(response.data.record.delegation);
      })
      .finally(() => {
        loading.value = false;
      });
  },
});
</script>
