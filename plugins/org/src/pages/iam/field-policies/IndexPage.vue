<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header description="按已接入资源配置字段的可见、编辑和筛选。" />
    </template>
    <div v-if="resourcesLoaded && resources.length === 0" class="p-16px">当前没有可配置资源</div>
    <in-split-layout v-else left-collapsible :persistence-key="SPLIT_KEY">
      <template #left>
        <resource-rail
          v-model="resourceId"
          :resources="resources"
          @select="privateSelectResource"
        />
      </template>
      <in-table
        v-if="selected"
        :loading="!fields"
        :data="fields ? rows : []"
        :headers="headers"
        :table-id="TABLE_ID"
        density="compact"
        :row-key="rowKeyOf"
      >
        <template #title>
          <span>{{ selected.name }}</span>
          <span class="in-table__count">共 {{ fields ? rows.length : 0 }} 条</span>
        </template>
        <template v-if="canUpdate" #tools-end>
          <in-button
            type="primary"
            :disabled="!canAdd || savingFields"
            v-auth="IamAction.TENANT_FIELD_POLICY_UPDATE"
            @click="privateAdd"
          >
            添加规则
          </in-button>
        </template>
        <template #empty>
          <el-empty description="还没有规则" />
        </template>
        <template v-if="canUpdate" #actions="{ item }">
          <in-table-actions :actions="rowActionsOf(item)" :row="item" />
        </template>
      </in-table>
    </in-split-layout>
    <policy-rule-dialog
      ref="ruleDialog"
      :fields="selected?.fields ?? []"
      :actions="selected?.actions ?? []"
      :resource-id="resourceId"
      :saving="savingFields"
      :load-members="loadMembers"
      @confirm="privateOnRuleConfirm"
    />
  </in-page-frame>
</template>

<script lang="ts" setup>
import { Message, useCapabilities, usePermissions } from "@ingot/admin-core";
import {
  AuthorizationDomain,
  IamAction,
  useFieldVisibilityEnum,
  type FieldOperationRule,
  type FieldPolicyDraft,
  type FieldPolicyResource,
  type FieldRule,
  type ResourceDetail,
} from "@ingot/admin-common";
import { TenantMemberPickerLoad } from "@/api/iam/directory";
import {
  TenantFieldPolicyAPI,
  TenantFieldPolicyResourceAPI,
  TenantFieldPolicyUpdateAPI,
} from "@/api/iam/policies";
import PolicyRuleDialog from "./components/PolicyRuleDialog.vue";
import ResourceRail from "./components/ResourceRail.vue";
import {
  RULE_KIND,
  SPLIT_KEY,
  TABLE_ID,
  tableHeaders,
  toPolicyRows,
  type PolicyRuleRow,
  type RuleKind,
} from "./table";
import { useOps } from "./useOps";

const { hasAction, contextEpoch } = useCapabilities();
const permissions = usePermissions();
const canReadFields = computed(
  () =>
    permissions.domain === AuthorizationDomain.TENANT &&
    hasAction(IamAction.TENANT_FIELD_POLICY_READ),
);
const canUpdate = computed(
  () => canReadFields.value && hasAction(IamAction.TENANT_FIELD_POLICY_UPDATE),
);
const resources = ref<FieldPolicyResource[]>([]);
const resourcesLoaded = ref(false);
const resourceId = ref("");
const selected = computed(() =>
  resources.value.find((item) => item.resourceId === resourceId.value),
);
const fields = ref<ResourceDetail<FieldPolicyDraft>>();
const fieldDraft = reactive<FieldPolicyDraft>({
  defaultRevisionId: "",
  rules: [],
  operationRules: [],
});
const savingFields = ref(false);
const ruleDialog = ref<{
  show: (input: {
    kind: RuleKind;
    index: number | null;
    visibility?: FieldRule;
    operation?: FieldOperationRule;
  }) => void;
  close: () => void;
}>();

const visibilityEnum = useFieldVisibilityEnum();
const fieldLabel = (key: string): string =>
  selected.value?.fields.find((field) => field.key === key)?.label ?? key;
const visibilityLabel = (value: FieldPolicyDraft["rules"][number]["visibility"]): string =>
  visibilityEnum.getTagText(value).text;
const rows = computed(() => toPolicyRows(fieldDraft, fieldLabel, visibilityLabel));
const headers = computed(() =>
  canUpdate.value ? tableHeaders : tableHeaders.filter((item) => item.prop !== "actions"),
);
const canAdd = computed(() => (selected.value?.fields.length ?? 0) > 0);
const loadMembers = TenantMemberPickerLoad;
const rowKeyOf = (row: PolicyRuleRow): string => row.key;

const privateEdit = (row: PolicyRuleRow): void => {
  if (row.kind === RULE_KIND.VISIBILITY) {
    ruleDialog.value?.show({
      kind: row.kind,
      index: row.index,
      visibility: fieldDraft.rules[row.index],
    });
    return;
  }
  ruleDialog.value?.show({
    kind: row.kind,
    index: row.index,
    operation: fieldDraft.operationRules[row.index],
  });
};

const privateRemove = (row: PolicyRuleRow): void => {
  const next = cloneDraft();
  if (row.kind === RULE_KIND.VISIBILITY) {
    next.rules.splice(row.index, 1);
  } else {
    next.operationRules.splice(row.index, 1);
  }
  void privatePersist(next, "规则已删除");
};

const { rowActionsOf } = useOps(privateEdit, privateRemove, () => savingFields.value);

const privateAdd = (): void => {
  ruleDialog.value?.show({ kind: RULE_KIND.VISIBILITY, index: null });
};

const cloneDraft = (): FieldPolicyDraft => structuredClone(toRaw(fieldDraft));

const privateOnRuleConfirm = (payload: {
  kind: RuleKind;
  index: number | null;
  visibility?: FieldRule;
  operation?: FieldOperationRule;
}): void => {
  const next = cloneDraft();
  if (payload.kind === RULE_KIND.VISIBILITY && payload.visibility) {
    if (payload.index === null) {
      next.rules.push(payload.visibility);
    } else {
      next.rules.splice(payload.index, 1, payload.visibility);
    }
  } else if (payload.operation) {
    if (payload.index === null) {
      next.operationRules.push(payload.operation);
    } else {
      next.operationRules.splice(payload.index, 1, payload.operation);
    }
  } else {
    return;
  }
  void privatePersist(next, "规则已保存").then((saved) => {
    if (saved) {
      ruleDialog.value?.close();
    }
  });
};

const applyFields = (detail: ResourceDetail<FieldPolicyDraft>): void => {
  fields.value = detail;
  fieldDraft.defaultRevisionId = detail.record.defaultRevisionId;
  fieldDraft.operationRules = structuredClone(detail.record.operationRules ?? []).map((item) => ({
    ...item,
    operations: {
      editable: Boolean(item.operations?.editable),
      filterable: Boolean(item.operations?.filterable),
    },
    viewerSelection: {
      members: [...item.viewerSelection.members],
      departments: item.viewerSelection.departments.map((entry) => ({ ...entry })),
    },
  }));
  fieldDraft.rules = detail.record.rules.map((item) => ({
    ...item,
    viewerSelection: {
      members: [...item.viewerSelection.members],
      departments: item.viewerSelection.departments.map((entry) => ({ ...entry })),
    },
    targetScope: item.targetScope.map((entry) => ({ ...entry })),
    scopeBindings: { ...item.scopeBindings },
  }));
};

const privatePersist = (policy: FieldPolicyDraft, success: string): Promise<boolean> => {
  if (!canUpdate.value || !fields.value || !resourceId.value || savingFields.value) {
    return Promise.resolve(false);
  }
  const epoch = contextEpoch.value;
  const id = resourceId.value;
  savingFields.value = true;
  return TenantFieldPolicyUpdateAPI(id, {
    expectedVersion: fields.value.version,
    policy,
  })
    .then((response) => {
      if (epoch !== contextEpoch.value || resourceId.value !== id || !canReadFields.value) {
        return false;
      }
      applyFields(response.data);
      Message.success(success);
      return true;
    })
    .catch(() => false)
    .finally(() => {
      savingFields.value = false;
    });
};

const loadFields = (): void => {
  const id = resourceId.value;
  if (!canReadFields.value || !id || fields.value) {
    return;
  }
  const epoch = contextEpoch.value;
  TenantFieldPolicyAPI(id).then((response) => {
    if (epoch === contextEpoch.value && resourceId.value === id && canReadFields.value) {
      applyFields(response.data);
    }
  });
};

const loadResources = (): void => {
  if (!canReadFields.value) {
    return;
  }
  const epoch = contextEpoch.value;
  TenantFieldPolicyResourceAPI().then((response) => {
    if (epoch !== contextEpoch.value || !canReadFields.value) {
      return;
    }
    resources.value = response.data;
    resourcesLoaded.value = true;
    const next = resources.value.some((item) => item.resourceId === resourceId.value)
      ? resourceId.value
      : (resources.value[0]?.resourceId ?? "");
    if (next === resourceId.value) {
      loadFields();
    } else {
      resourceId.value = next;
    }
  });
};

const privateSelectResource = (id: string): void => {
  if (!id || id === resourceId.value || savingFields.value) {
    return;
  }
  ruleDialog.value?.close();
  resourceId.value = id;
};

watch(
  canReadFields,
  (allowed) => {
    if (!allowed) {
      fields.value = undefined;
      resources.value = [];
      resourcesLoaded.value = false;
      resourceId.value = "";
      return;
    }
    loadResources();
  },
  { immediate: true },
);

watch(resourceId, () => {
  fields.value = undefined;
  if (canReadFields.value) {
    loadFields();
  }
});

watch(contextEpoch, () => {
  fields.value = undefined;
  resources.value = [];
  resourcesLoaded.value = false;
  resourceId.value = "";
  if (canReadFields.value) {
    loadResources();
  }
});
</script>

<style scoped lang="postcss">
/* 压过分栏组件自己的左侧内边距，让「资源」和右侧标题对齐。 */
:deep(.in-split-layout.in-split-layout .in-split-layout__left-scroll) {
  padding: var(--in-space-5);
  gap: 0;
  overflow: hidden;
}

:deep(.in-split-layout.in-split-layout .in-split-layout__left-scroll > *) {
  flex: 1;
  min-height: 0;
}
</style>
