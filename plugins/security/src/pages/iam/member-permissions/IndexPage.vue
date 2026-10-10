<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header
        description="通讯录可见范围与字段权限。预览来自后端，浏览器不重做策略引擎。"
      />
    </template>
    <in-split-layout>
      <in-biz-tabs v-model="tab">
        <in-biz-tab-panel title="通讯录可见范围" name="directory">
          <el-form v-if="directory" label-position="top" class="p-16px">
            <el-form-item label="默认策略版本">
              <span>{{ directoryDraft.defaultRevisionId || "-" }}</span>
            </el-form-item>
            <el-form-item label="本地默认范围">
              <el-select
                v-model="defaultScope"
                clearable
                placeholder="继承固定版本"
                class="w-220px"
              >
                <el-option
                  v-for="option in defaultScopeOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
            <biz-iam-selection-editor
              v-if="defaultScope === DirectoryDefaultScope.SELECTED"
              v-model="defaultSelection"
              :load-members="loadMembers"
              :load-departments="loadDepartments"
            />
            <div
              v-for="(rule, index) in directoryDraft.rules"
              :key="index"
              class="mb-16px border p-12px"
            >
              <el-form-item :label="`规则 ${index + 1}`">
                <el-select v-model="rule.effect" class="w-160px" placeholder="请选择效果">
                  <el-option
                    v-for="option in effectOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
                <in-button
                  class="ml-8px"
                  text
                  type="danger"
                  @click="privateRemoveDirectoryRule(index)"
                >
                  删除
                </in-button>
              </el-form-item>
              <div class="mb-8px">查看者</div>
              <biz-iam-selection-editor
                v-model="rule.viewerSelection"
                :load-members="loadMembers"
                :load-departments="loadDepartments"
              />
              <div class="mb-8px mt-12px">目标</div>
              <biz-iam-selection-editor
                v-model="rule.targetSelection"
                :load-members="loadMembers"
                :load-departments="loadDepartments"
              />
            </div>
            <el-form-item label="预览查看者">
              <in-page-select
                v-model="viewerMemberId"
                filterable
                remote
                clearable
                value-field="id"
                label-field="name"
                placeholder="选择预览查看者"
                :load-data="loadMembers"
              />
            </el-form-item>
            <div class="flex flex-wrap gap-8px">
              <in-button @click="privateAddDirectoryRule">添加规则</in-button>
              <in-button @click="privatePreviewDirectory">预览</in-button>
              <in-button type="primary" :loading="savingDirectory" @in-click="privateSaveDirectory">
                保存
              </in-button>
            </div>
            <biz-iam-preview-alert :preview="directoryPreview" />
          </el-form>
        </in-biz-tab-panel>
        <in-biz-tab-panel title="字段权限" name="fields">
          <el-form v-if="fields" label-position="top" class="p-16px">
            <el-form-item label="默认策略版本">
              <span>{{ fieldDraft.defaultRevisionId || "-" }}</span>
            </el-form-item>
            <div
              v-for="(rule, index) in fieldDraft.rules"
              :key="index"
              class="mb-16px border p-12px"
            >
              <el-form-item :label="`字段规则 ${index + 1}`">
                <el-select v-model="rule.scenario" class="w-160px" placeholder="请选择场景">
                  <el-option
                    v-for="option in scenarioOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
                <el-input v-model="rule.fieldKey" class="ml-8px w-180px" placeholder="字段键" />
                <in-button class="ml-8px" text type="danger" @click="privateRemoveFieldRule(index)">
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
              <el-form-item label="场景">
                <el-select
                  v-model="rule.scenario"
                  placeholder="请选择场景"
                  @change="privateOperationScenario(rule)"
                >
                  <el-option
                    v-for="option in scenarioOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="操作">
                <el-select v-model="rule.actionCode" placeholder="请选择操作">
                  <el-option
                    v-for="option in operationActions(rule.scenario)"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
                <el-input
                  v-model="rule.fieldKey"
                  class="ml-8px w-180px"
                  placeholder="已接入的逻辑字段键"
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
              <in-button text type="danger" @click="fieldDraft.operationRules.splice(index, 1)"
                >删除操作规则</in-button
              >
            </div>
            <in-button class="mb-12px" @click="privateAddOperationRule">添加操作规则</in-button>
            <el-form-item label="预览查看者">
              <in-page-select
                v-model="viewerMemberId"
                filterable
                remote
                clearable
                value-field="id"
                label-field="name"
                placeholder="选择预览查看者"
                :load-data="loadMembers"
              />
            </el-form-item>
            <div class="flex flex-wrap gap-8px">
              <in-button @click="privateAddFieldRule">添加规则</in-button>
              <in-button @click="privatePreviewFields">预览</in-button>
              <in-button type="primary" :loading="savingFields" @in-click="privateSaveFields"
                >保存</in-button
              >
            </div>
            <biz-iam-preview-alert :preview="fieldPreview" />
          </el-form>
        </in-biz-tab-panel>
      </in-biz-tabs>
    </in-split-layout>
  </in-page-frame>
</template>

<script lang="ts" setup>
import { Message } from "@ingot/admin-core";
import {
  BizIamPreviewAlert,
  BizIamScopeEditor,
  BizIamSelectionEditor,
  DefaultPolicyKind,
  DirectoryDefaultScope,
  FieldVisibility,
  PolicyEffect,
  PolicyScenario,
  AuthorizationDomain,
  IamAction,
  type FieldOperationRule,
  createIamListLoader,
  emptySelection,
  toIamSelectRecords,
  useDirectoryDefaultScopeEnum,
  useFieldVisibilityEnum,
  usePolicyEffectEnum,
  usePolicyScenarioEnum,
  type DirectoryPolicyDraft,
  type FieldPolicyDraft,
  type PolicyPreviewResult,
  type Preview,
  type ResourceDetail,
  type Selection,
} from "@ingot/admin-common";
import { SecurityDepartmentPageAPI, SecurityMemberPageAPI } from "@/api/iam/directory";
import {
  SecurityDirectoryPolicyAPI,
  SecurityDirectoryPolicyUpdateAPI,
  SecurityFieldPolicyAPI,
  SecurityFieldPolicyUpdateAPI,
  SecurityPolicyPreviewAPI,
} from "@/api/iam/policies";

const tab = ref("directory");
const directory = ref<ResourceDetail<DirectoryPolicyDraft>>();
const fields = ref<ResourceDetail<FieldPolicyDraft>>();
const directoryDraft = reactive<DirectoryPolicyDraft>({
  defaultRevisionId: "",
  rules: [],
});
const fieldDraft = reactive<FieldPolicyDraft>({
  defaultRevisionId: "",
  rules: [],
  operationRules: [],
});
const defaultScope = ref<DirectoryDefaultScope | "">("");
const defaultSelection = ref<Selection>(emptySelection());
const viewerMemberId = ref("");
const savingDirectory = ref(false);
const savingFields = ref(false);
const directoryPreview = ref<Preview<PolicyPreviewResult> | null>(null);
const fieldPreview = ref<Preview<PolicyPreviewResult> | null>(null);
const defaultScopeOptions = useDirectoryDefaultScopeEnum().getOptions();
const effectOptions = usePolicyEffectEnum().getOptions();
const scenarioOptions = usePolicyScenarioEnum().getOptions();
const visibilityOptions = useFieldVisibilityEnum().getOptions();

const loadMembers = createIamListLoader(async (page, condition) => {
  const response = await SecurityMemberPageAPI(page, condition);
  return { data: toIamSelectRecords(response.data) };
});
const loadDepartments = createIamListLoader(async (page, condition) => {
  const response = await SecurityDepartmentPageAPI(page, condition);
  return { data: toIamSelectRecords(response.data) };
});

const applyDirectory = (detail: ResourceDetail<DirectoryPolicyDraft>): void => {
  directory.value = detail;
  directoryDraft.defaultRevisionId = detail.record.defaultRevisionId;
  directoryDraft.defaultOverride = detail.record.defaultOverride;
  directoryDraft.rules = detail.record.rules.map((item) => ({
    effect: item.effect,
    viewerSelection: {
      members: [...item.viewerSelection.members],
      departments: item.viewerSelection.departments.map((entry) => ({ ...entry })),
    },
    targetSelection: {
      members: [...item.targetSelection.members],
      departments: item.targetSelection.departments.map((entry) => ({ ...entry })),
    },
  }));
  defaultScope.value = detail.record.defaultOverride?.scope ?? "";
  defaultSelection.value = detail.record.defaultOverride?.selection ?? emptySelection();
};

const applyFields = (detail: ResourceDetail<FieldPolicyDraft>): void => {
  fields.value = detail;
  fieldDraft.defaultRevisionId = detail.record.defaultRevisionId;
  fieldDraft.operationRules = structuredClone(detail.record.operationRules ?? []);
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

const currentDirectoryPolicy = (): DirectoryPolicyDraft => ({
  defaultRevisionId: directoryDraft.defaultRevisionId,
  defaultOverride: defaultScope.value
    ? {
        scope: defaultScope.value,
        selection:
          defaultScope.value === DirectoryDefaultScope.SELECTED
            ? defaultSelection.value
            : undefined,
      }
    : undefined,
  rules: directoryDraft.rules,
});

const privateAddDirectoryRule = (): void => {
  directoryDraft.rules.push({
    effect: PolicyEffect.ALLOW,
    viewerSelection: emptySelection(),
    targetSelection: emptySelection(),
  });
};

const privateRemoveDirectoryRule = (index: number): void => {
  directoryDraft.rules.splice(index, 1);
};

const privateAddFieldRule = (): void => {
  fieldDraft.rules.push({
    scenario: PolicyScenario.DIRECTORY,
    fieldKey: "",
    viewerSelection: emptySelection(),
    targetScope: [],
    scopeBindings: {},
    visibility: FieldVisibility.FULL,
  });
};

const operationActions = (scenario: PolicyScenario) =>
  scenario === PolicyScenario.DIRECTORY
    ? [{ value: IamAction.TENANT_DIRECTORY_READ, label: "通讯录查询" }]
    : [
        { value: IamAction.TENANT_MEMBER_READ, label: "成员查询" },
        { value: IamAction.TENANT_MEMBER_CREATE, label: "成员创建" },
        { value: IamAction.TENANT_MEMBER_UPDATE, label: "成员编辑" },
      ];
const privateOperationScenario = (rule: FieldOperationRule): void => {
  rule.resource = {
    domain: AuthorizationDomain.TENANT,
    applicationCode: "iam-tenant",
    resourceCode: rule.scenario === PolicyScenario.DIRECTORY ? "directory" : "member",
  };
  rule.actionCode = operationActions(rule.scenario)[0]!.value;
  rule.operations = { editable: false, filterable: false };
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

const privatePreviewDirectory = (): void => {
  if (!viewerMemberId.value) {
    Message.warning("请选择预览查看者");
    return;
  }
  SecurityPolicyPreviewAPI({
    policyDraft: { kind: DefaultPolicyKind.DIRECTORY, directory: currentDirectoryPolicy() },
    viewerMemberId: viewerMemberId.value,
  }).then((response) => {
    directoryPreview.value = response.data;
  });
};

const privatePreviewFields = (): void => {
  if (!viewerMemberId.value) {
    Message.warning("请选择预览查看者");
    return;
  }
  SecurityPolicyPreviewAPI({
    policyDraft: { kind: DefaultPolicyKind.FIELD, field: { ...fieldDraft } },
    viewerMemberId: viewerMemberId.value,
  }).then((response) => {
    fieldPreview.value = response.data;
  });
};

const privateSaveDirectory = (): void => {
  if (!directory.value) {
    return;
  }
  savingDirectory.value = true;
  directoryPreview.value = null;
  SecurityDirectoryPolicyUpdateAPI({
    expectedVersion: directory.value.version,
    policy: currentDirectoryPolicy(),
  })
    .then((response) => {
      applyDirectory(response.data);
      Message.success("通讯录策略已保存");
    })
    .finally(() => {
      savingDirectory.value = false;
    });
};

const privateSaveFields = (): void => {
  if (!fields.value) {
    return;
  }
  savingFields.value = true;
  fieldPreview.value = null;
  SecurityFieldPolicyUpdateAPI({
    expectedVersion: fields.value.version,
    policy: { ...fieldDraft },
  })
    .then((response) => {
      applyFields(response.data);
      Message.success("字段策略已保存");
    })
    .finally(() => {
      savingFields.value = false;
    });
};

const loadDirectory = (): void => {
  SecurityDirectoryPolicyAPI().then((response) => applyDirectory(response.data));
};

const loadFields = (): void => {
  if (fields.value) {
    return;
  }
  SecurityFieldPolicyAPI().then((response) => applyFields(response.data));
};

onMounted(() => {
  loadDirectory();
});

watch(tab, (name) => {
  if (name === "fields") {
    loadFields();
  }
});
</script>
