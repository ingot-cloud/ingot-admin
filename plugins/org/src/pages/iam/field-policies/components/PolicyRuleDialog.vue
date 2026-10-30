<template>
  <in-dialog
    :model-value="visible"
    :title="title"
    width="640px"
    layout="pinned"
    append-to-body
    :close-on-click-modal="false"
    @update:model-value="privateVisible"
  >
    <p class="field-dialog__intro">{{ intro }}</p>
    <el-form class="field-dialog-form in-detail-form" label-position="left" label-width="88px">
      <el-form-item label="规则类型">
        <el-radio-group v-model="kind" :disabled="editing">
          <el-radio :value="RULE_KIND.VISIBILITY">可见性</el-radio>
          <el-radio :value="RULE_KIND.OPERATION" :disabled="actions.length === 0">操作</el-radio>
        </el-radio-group>
        <p class="field-dialog__hint">可见性按目标范围收紧，操作按具体动作收紧编辑或筛选。</p>
      </el-form-item>
      <el-form-item label="字段" :error="errors.field">
        <el-select v-model="fieldKey" class="w-full" placeholder="请选择字段">
          <el-option
            v-for="field in fields"
            :key="field.key"
            :label="field.label"
            :value="field.key"
          />
        </el-select>
      </el-form-item>
      <el-form-item v-if="kind === RULE_KIND.VISIBILITY" label="可见性" :error="errors.visibility">
        <el-select v-model="visibility" class="w-full" placeholder="请选择可见性">
          <el-option
            v-for="option in visibilityOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
        <p class="field-dialog__hint">只能选择该字段已开放的可见档位。</p>
      </el-form-item>
      <template v-else>
        <el-form-item label="操作" :error="errors.action">
          <el-select v-model="actionCode" class="w-full" placeholder="请选择操作">
            <el-option
              v-for="action in actions"
              :key="action.code"
              :label="action.name"
              :value="action.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="能力">
          <div class="field-dialog__flags">
            <el-checkbox v-model="editable" :disabled="!editableAllowed">可编辑</el-checkbox>
            <el-checkbox v-model="filterable" :disabled="!filterableAllowed">可筛选</el-checkbox>
          </div>
          <p class="field-dialog__hint">查询操作只能配置筛选，变更操作只能配置编辑。</p>
        </el-form-item>
      </template>
      <el-form-item label="成员">
        <biz-tenant-member-select
          v-model="members"
          multiple
          :load-members="loadMembers"
          placeholder="请选择成员"
        />
        <p class="field-dialog__hint">不选择成员和部门时，这条规则不会生效。</p>
      </el-form-item>
      <el-form-item label="部门">
        <group-department-field v-model="departments" :default-include-descendants="false" />
      </el-form-item>
      <el-form-item v-if="kind === RULE_KIND.VISIBILITY" label="目标范围" :error="errors.scope">
        <policy-target-scope-field v-model="target" :load-members="loadMembers" />
      </el-form-item>
    </el-form>
    <template #footer>
      <in-button :disabled="saving" @click="privateCancel">取消</in-button>
      <in-button type="primary" :loading="saving" @in-click="privateConfirm">{{
        confirmLabel
      }}</in-button>
    </template>
  </in-dialog>
</template>

<script setup lang="ts">
import {
  BizTenantMemberSelect,
  FieldVisibility,
  ScopeKind,
  useFieldVisibilityEnum,
  type FieldCapability,
  type FieldOperationRule,
  type FieldPolicyAction,
  type FieldRule,
  type IamSelectOption,
  type OrganizationMemberParams,
  type Selection,
} from "@ingot/admin-common";
import type { Page } from "@ingot/admin-core";
import GroupDepartmentField, {
  type GroupDepartmentDraft,
} from "../../groups/components/GroupDepartmentField.vue";
import PolicyTargetScopeField from "./PolicyTargetScopeField.vue";
import { RULE_KIND, type RuleKind, actionIsRead } from "../table";
import { buildTarget, emptyTarget, parseTarget, type PolicyTargetValue } from "../scope";

defineOptions({ name: "PolicyRuleDialog" });

const props = defineProps<{
  fields: FieldCapability[];
  actions: FieldPolicyAction[];
  resourceId: string;
  saving?: boolean;
  loadMembers: (params: OrganizationMemberParams) => Promise<Page<IamSelectOption>>;
}>();

const emit = defineEmits<{
  confirm: [
    payload: {
      kind: RuleKind;
      index: number | null;
      visibility?: FieldRule;
      operation?: FieldOperationRule;
    },
  ];
}>();

const visibilityCatalog = useFieldVisibilityEnum().getOptions();
const visible = ref(false);
const editing = ref(false);
const index = ref<number | null>(null);
const kind = ref<RuleKind>(RULE_KIND.VISIBILITY);
const fieldKey = ref("");
const visibility = ref<FieldVisibility>(FieldVisibility.FULL);
const actionCode = ref("");
const editable = ref(false);
const filterable = ref(false);
const members = ref<string[]>([]);
const departments = ref<GroupDepartmentDraft[]>([]);
const target = ref<PolicyTargetValue>(emptyTarget());
const errors = ref<Record<string, string>>({});

const title = computed(() => (editing.value ? "编辑规则" : "添加规则"));
const confirmLabel = computed(() => (editing.value ? "确认" : "添加"));
const intro = computed(() =>
  kind.value === RULE_KIND.VISIBILITY
    ? "为指定查看者收紧字段在目标范围内的可见性。"
    : "为指定查看者收紧某个操作上的编辑或筛选。",
);
const capability = computed(() => props.fields.find((field) => field.key === fieldKey.value));
const visibilityOptions = computed(() => {
  const allowed = capability.value?.visibilities;
  if (!allowed) {
    return visibilityCatalog;
  }
  return visibilityCatalog.filter((option) => allowed.includes(option.value));
});
const editableAllowed = computed(
  () => Boolean(capability.value?.editable) && !actionIsRead(actionCode.value),
);
const filterableAllowed = computed(
  () => Boolean(capability.value?.filterable) && actionIsRead(actionCode.value),
);

const privateClamp = (): void => {
  const allowed = visibilityOptions.value;
  if (allowed.length > 0 && !allowed.some((option) => option.value === visibility.value)) {
    visibility.value = allowed[0].value;
  }
  if (!editableAllowed.value) {
    editable.value = false;
  }
  if (!filterableAllowed.value) {
    filterable.value = false;
  }
};

watch([fieldKey, actionCode], privateClamp);

const privateSelection = (): Selection => ({
  members: [...members.value],
  departments: departments.value.map((item) => ({
    id: item.id,
    includeDescendants: item.includeDescendants,
  })),
});

const privateShow = (input: {
  kind: RuleKind;
  index: number | null;
  visibility?: FieldRule;
  operation?: FieldOperationRule;
}): void => {
  editing.value = input.index !== null;
  index.value = input.index;
  kind.value = input.kind;
  errors.value = {};
  const fallbackField = props.fields[0]?.key ?? "";
  if (input.visibility) {
    fieldKey.value = input.visibility.fieldKey;
    visibility.value = input.visibility.visibility;
    members.value = [...input.visibility.viewerSelection.members];
    departments.value = input.visibility.viewerSelection.departments.map((item) => ({
      id: item.id,
      name: "",
      includeDescendants: item.includeDescendants === true,
    }));
    target.value = parseTarget(input.visibility);
    actionCode.value = props.actions[0]?.code ?? "";
    editable.value = false;
    filterable.value = false;
  } else if (input.operation) {
    fieldKey.value = input.operation.fieldKey;
    actionCode.value = input.operation.actionCode;
    editable.value = input.operation.operations.editable;
    filterable.value = input.operation.operations.filterable;
    members.value = [...input.operation.viewerSelection.members];
    departments.value = input.operation.viewerSelection.departments.map((item) => ({
      id: item.id,
      name: "",
      includeDescendants: item.includeDescendants === true,
    }));
    target.value = emptyTarget();
    visibility.value = FieldVisibility.FULL;
  } else {
    fieldKey.value = fallbackField;
    visibility.value = FieldVisibility.FULL;
    actionCode.value = props.actions[0]?.code ?? "";
    editable.value = false;
    filterable.value = false;
    members.value = [];
    departments.value = [];
    target.value = emptyTarget();
  }
  privateClamp();
  visible.value = true;
};

const privateVisible = (open: boolean): void => {
  if (!open && props.saving) {
    return;
  }
  visible.value = open;
};

const privateCancel = (): void => {
  if (props.saving) {
    return;
  }
  visible.value = false;
};

const privateConfirm = (): void => {
  if (props.saving) {
    return;
  }
  const nextErrors: Record<string, string> = {};
  if (!fieldKey.value) {
    nextErrors.field = "请选择字段";
  }
  if (kind.value === RULE_KIND.VISIBILITY && !visibility.value) {
    nextErrors.visibility = "请选择可见性";
  }
  if (kind.value === RULE_KIND.OPERATION && !actionCode.value) {
    nextErrors.action = "请选择操作";
  }
  if (
    kind.value === RULE_KIND.VISIBILITY &&
    target.value.kind === ScopeKind.MANAGED_DEPARTMENTS &&
    target.value.departmentIds.length === 0
  ) {
    nextErrors.scope = "请选择部门";
  }
  if (
    kind.value === RULE_KIND.VISIBILITY &&
    target.value.kind === ScopeKind.OBJECT_SET &&
    target.value.memberIds.length === 0
  ) {
    nextErrors.scope = "请选择成员";
  }
  errors.value = nextErrors;
  if (Object.keys(nextErrors).length > 0) {
    return;
  }
  const viewerSelection = privateSelection();
  const built = buildTarget(target.value, props.resourceId);
  if (kind.value === RULE_KIND.VISIBILITY) {
    emit("confirm", {
      kind: kind.value,
      index: index.value,
      visibility: {
        fieldKey: fieldKey.value,
        viewerSelection,
        targetScope: built.targetScope,
        scopeBindings: built.scopeBindings,
        visibility: visibility.value,
      },
    });
    return;
  }
  emit("confirm", {
    kind: kind.value,
    index: index.value,
    operation: {
      actionCode: actionCode.value,
      fieldKey: fieldKey.value,
      viewerSelection,
      operations: { editable: editable.value, filterable: filterable.value },
    },
  });
};

defineExpose({ show: privateShow, close: privateCancel });
</script>

<style lang="postcss" scoped>
.field-dialog-form.in-detail-form :deep(.el-form-item) {
  flex-direction: row;
  align-items: flex-start;
  gap: var(--in-space-3);
  margin-bottom: var(--in-space-4);
}
.field-dialog-form.in-detail-form :deep(.el-form-item__label) {
  flex: none;
  line-height: var(--in-control-height);
}
.field-dialog-form.in-detail-form :deep(.el-form-item__content) {
  line-height: var(--in-line-height-body);
}
.field-dialog__intro {
  margin-bottom: var(--in-space-5);
  color: var(--in-text-color-secondary);
  font-size: var(--in-font-size-caption);
}
.field-dialog__hint {
  width: 100%;
  margin-top: var(--in-space-1);
  color: var(--in-text-color-secondary);
  font-size: var(--in-font-size-caption);
  line-height: var(--in-line-height-body);
}
.field-dialog__flags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--in-space-3);
  & :deep(.el-checkbox) {
    margin-right: 0;
  }
}
</style>
