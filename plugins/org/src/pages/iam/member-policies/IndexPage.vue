<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header description="配置后台管理中的成员字段可见、编辑和筛选。" />
    </template>
    <in-split-layout>
      <in-biz-tabs v-model="tab">
        <in-biz-tab-panel v-if="canReadFields" title="字段权限" name="fields">
          <el-form
            v-if="fields"
            :disabled="!hasAction(IamAction.TENANT_FIELD_POLICY_UPDATE)"
            label-position="top"
            class="p-16px"
          >
            <el-form-item label="默认策略版本">
              <span>{{ fieldDraft.defaultRevisionId || "-" }}</span>
            </el-form-item>
            <div
              v-for="(rule, index) in fieldDraft.rules"
              :key="index"
              class="mb-16px border p-12px"
            >
              <el-form-item :label="`字段规则 ${index + 1}`">
                <el-input v-model="rule.fieldKey" class="w-180px" placeholder="请输入字段键" />
                <in-button
                  class="ml-8px"
                  text
                  type="danger"
                  v-auth="IamAction.TENANT_FIELD_POLICY_UPDATE"
                  @click="privateRemoveFieldRule(index)"
                >
                  删除
                </in-button>
              </el-form-item>
              <el-form-item label="可见性">
                <el-select v-model="rule.visibility" class="w-160px" placeholder="请选择可见性">
                  <el-option
                    v-for="option in visibilityOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
              </el-form-item>
              <div class="mb-8px">查看者</div>
              <biz-iam-selection-editor
                v-model="rule.viewerSelection"
                :load-members="loadMembers"
                :load-departments="loadDepartments"
              />
              <el-form-item label="目标范围">
                <biz-iam-scope-editor v-model="rule.targetScope" />
              </el-form-item>
            </div>
            <div class="mb-12px">字段操作能力（按查看者与具体操作，全局生效）</div>
            <div
              v-for="(rule, index) in fieldDraft.operationRules"
              :key="index"
              class="mb-16px border p-12px"
            >
              <el-form-item label="操作">
                <el-select v-model="rule.actionCode" placeholder="请选择操作">
                  <el-option
                    v-for="option in operationActions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
                <el-input
                  v-model="rule.fieldKey"
                  class="ml-8px w-180px"
                  placeholder="请输入已接入的逻辑字段键"
                />
              </el-form-item>
              <el-form-item label="能力">
                <el-checkbox
                  v-model="rule.operations.editable"
                  :disabled="rule.actionCode.endsWith(':read')"
                  >可编辑</el-checkbox
                >
                <el-checkbox
                  v-model="rule.operations.filterable"
                  :disabled="!rule.actionCode.endsWith(':read')"
                  >可筛选</el-checkbox
                >
              </el-form-item>
              <biz-iam-selection-editor
                v-model="rule.viewerSelection"
                :load-members="loadMembers"
                :load-departments="loadDepartments"
              />
              <in-button
                text
                type="danger"
                v-auth="IamAction.TENANT_FIELD_POLICY_UPDATE"
                @click="fieldDraft.operationRules.splice(index, 1)"
                >删除操作规则</in-button
              >
            </div>
            <in-button
              class="mb-12px"
              v-auth="IamAction.TENANT_FIELD_POLICY_UPDATE"
              @click="privateAddOperationRule"
              >添加操作规则</in-button
            >
          </el-form>
          <el-form v-if="fields" label-position="top" class="p-16px">
            <div class="flex flex-wrap gap-8px">
              <in-button v-auth="IamAction.TENANT_FIELD_POLICY_UPDATE" @click="privateAddFieldRule"
                >添加规则</in-button
              >
              <in-button
                type="primary"
                :loading="savingFields"
                v-auth="IamAction.TENANT_FIELD_POLICY_UPDATE"
                @in-click="privateSaveFields"
                >保存</in-button
              >
            </div>
          </el-form>
        </in-biz-tab-panel>
      </in-biz-tabs>
    </in-split-layout>
  </in-page-frame>
</template>

<script lang="ts" setup>
import { useCapabilities, usePermissions, Message } from "@ingot/admin-core";
import {
  BizIamScopeEditor,
  BizIamSelectionEditor,
  FieldVisibility,
  PolicyScenario,
  AuthorizationDomain,
  IamAction,
  createIamListLoader,
  emptySelection,
  toIamSelectRecords,
  useFieldVisibilityEnum,
  type FieldPolicyDraft,
  type ResourceDetail,
} from "@ingot/admin-common";
import { TenantDepartmentPageAPI, TenantMemberPickerLoad } from "@/api/iam/directory";
import { TenantFieldPolicyAPI, TenantFieldPolicyUpdateAPI } from "@/api/iam/policies";

const { hasAction, contextEpoch } = useCapabilities();
const permissions = usePermissions();
const canReadFields = computed(
  () =>
    permissions.domain === AuthorizationDomain.TENANT &&
    hasAction(IamAction.TENANT_FIELD_POLICY_READ),
);
const tab = ref("");

const fields = ref<ResourceDetail<FieldPolicyDraft>>();
const fieldDraft = reactive<FieldPolicyDraft>({
  defaultRevisionId: "",
  rules: [],
  operationRules: [],
});
const savingFields = ref(false);
const visibilityOptions = useFieldVisibilityEnum().getOptions();
const operationActions = [
  { value: IamAction.TENANT_MEMBER_READ, label: "成员查询" },
  { value: IamAction.TENANT_MEMBER_CREATE, label: "成员创建" },
  { value: IamAction.TENANT_MEMBER_UPDATE, label: "成员编辑" },
];

const loadMembers = TenantMemberPickerLoad;
const loadDepartments = createIamListLoader(async (page, condition) => {
  const response = await TenantDepartmentPageAPI(page, condition);
  return { data: toIamSelectRecords(response.data) };
});

const applyFields = (detail: ResourceDetail<FieldPolicyDraft>): void => {
  fields.value = detail;
  fieldDraft.defaultRevisionId = detail.record.defaultRevisionId;
  fieldDraft.operationRules = structuredClone(detail.record.operationRules ?? []).map((item) => ({
    ...item,
    scenario: PolicyScenario.MANAGEMENT,
    resource: { ...item.resource, resourceCode: "member" },
  }));
  fieldDraft.rules = detail.record.rules.map((item) => ({
    ...item,
    scenario: PolicyScenario.MANAGEMENT,
    viewerSelection: {
      members: [...item.viewerSelection.members],
      departments: item.viewerSelection.departments.map((entry) => ({ ...entry })),
    },
    targetScope: item.targetScope.map((entry) => ({ ...entry })),
    scopeBindings: { ...item.scopeBindings },
  }));
};

const privateAddFieldRule = (): void => {
  fieldDraft.rules.push({
    scenario: PolicyScenario.MANAGEMENT,
    fieldKey: "",
    viewerSelection: emptySelection(),
    targetScope: [],
    scopeBindings: {},
    visibility: FieldVisibility.FULL,
  });
};

const privateAddOperationRule = (): void => {
  fieldDraft.operationRules.push({
    resource: {
      domain: AuthorizationDomain.TENANT,
      applicationCode: "iam-tenant",
      resourceCode: "member",
    },
    scenario: PolicyScenario.MANAGEMENT,
    actionCode: IamAction.TENANT_MEMBER_UPDATE,
    fieldKey: "",
    viewerSelection: emptySelection(),
    operations: { editable: false, filterable: false },
  });
};
const privateRemoveFieldRule = (index: number): void => {
  fieldDraft.rules.splice(index, 1);
};

const privateSaveFields = (): void => {
  if (!hasAction(IamAction.TENANT_FIELD_POLICY_UPDATE)) return;
  if (!fields.value) {
    return;
  }
  const epoch = contextEpoch.value;
  savingFields.value = true;
  TenantFieldPolicyUpdateAPI({
    expectedVersion: fields.value.version,
    policy: { ...fieldDraft },
  })
    .then((response) => {
      if (epoch !== contextEpoch.value || !canReadFields.value) return;
      applyFields(response.data);
      Message.success("字段策略已保存");
    })
    .finally(() => {
      savingFields.value = false;
    });
};

const loadFields = (): void => {
  if (!canReadFields.value || tab.value !== "fields" || fields.value) {
    return;
  }
  const epoch = contextEpoch.value;
  TenantFieldPolicyAPI().then((response) => {
    if (epoch === contextEpoch.value && canReadFields.value) applyFields(response.data);
  });
};

watch(
  canReadFields,
  () => {
    if (!canReadFields.value) fields.value = undefined;
    if (tab.value !== "fields" || !canReadFields.value) {
      tab.value = canReadFields.value ? "fields" : "";
    }
  },
  { immediate: true },
);
watch(
  [tab, canReadFields],
  () => {
    if (tab.value === "fields") loadFields();
  },
  { immediate: true },
);
watch(contextEpoch, () => {
  fields.value = undefined;
  if (tab.value === "fields") loadFields();
});
</script>
