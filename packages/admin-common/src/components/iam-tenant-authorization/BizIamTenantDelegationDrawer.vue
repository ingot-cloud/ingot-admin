<template>
  <in-drawer
    v-model="visible"
    title="授权管理员委派"
    size="840px"
    :loading="loading"
    :before-close="privateBeforeClose"
  >
    <in-form>
      <el-form-item label="授权管理员" required
        ><biz-iam-delegation-candidate-picker
          v-model="draft.administratorMemberId"
          :api="optionsAPI"
          :load-member-browse="loadMemberBrowse"
          :query="{ kind: 'MEMBER' }"
          title="选择授权管理员"
          placeholder="请选择管理员"
          search-placeholder="搜索成员名称"
      /></el-form-item>
      <el-form-item label="允许分配的角色" required
        ><biz-iam-delegation-candidate-picker
          v-model="draft.allowedRoleIds"
          :api="optionsAPI"
          :load-member-browse="loadMemberBrowse"
          :query="{ kind: 'ROLE' }"
          multiple
          title="选择角色"
          placeholder="请选择允许分配的角色"
          search-placeholder="搜索角色名"
      /></el-form-item>
      <el-form-item label="接收成员"
        ><biz-iam-delegation-candidate-picker
          v-model="draft.recipientSelection.members"
          :api="optionsAPI"
          :load-member-browse="loadMemberBrowse"
          :query="{ kind: 'MEMBER' }"
          multiple
          title="选择接收成员"
          placeholder="请选择接收成员"
          search-placeholder="搜索成员名称"
      /></el-form-item>
      <el-form-item label="接收部门"
        ><biz-iam-delegation-candidate-picker
          v-model="departmentIds"
          :api="departmentCandidates"
          :query="{ kind: 'OBJECT' }"
          @selection="(items) => items.forEach((item) => (departmentNames[item.id] = item.name))"
          multiple
          title="选择接收部门"
          placeholder="请选择接收部门"
          search-placeholder="搜索部门名"
        /><el-checkbox
          v-for="department in draft.recipientSelection.departments"
          :key="department.id"
          v-model="department.includeDescendants"
          >{{ departmentNames[department.id] || "所选部门" }} 含下级</el-checkbox
        ></el-form-item
      >
      <div
        v-for="ceiling in draft.resourceScopeCeilings"
        :key="ceiling.resourceId"
        class="border border-solid border-[var(--in-border-color)] rounded-4px p-12px mb-12px"
      >
        <div class="mb-8px">
          {{ resourceNames[ceiling.resourceId] || ceiling.resourceId }} 数据范围上限
        </div>
        <el-select
          :model-value="ceiling.scopes[0]?.kind"
          placeholder="请选择资源上限"
          @change="(kind: ScopeKind) => privateScope(ceiling, kind)"
          ><el-option
            v-for="kind in capabilities[ceiling.resourceId] || []"
            :key="kind"
            :label="formatScopeKinds([kind])"
            :value="kind"
        /></el-select>
        <el-checkbox
          v-if="
            ceiling.scopes[0]?.kind === ScopeKind.MANAGED_DEPARTMENTS ||
            ceiling.scopes[0]?.kind === ScopeKind.MEMBER_DEPARTMENTS
          "
          v-model="ceiling.scopes[0].includeDescendants"
          >含下级</el-checkbox
        >
        <biz-iam-delegation-candidate-picker
          v-if="ceiling.scopes[0]?.parameterKey"
          :model-value="ceiling.scopeBindings[ceiling.scopes[0].parameterKey]?.ids || []"
          :api="scopeAPIOf(ceiling.resourceId)"
          :query="{ kind: 'OBJECT', parameterKey: ceiling.scopes[0].parameterKey }"
          multiple
          title="配置委派范围"
          placeholder="请选择资源范围上限"
          search-placeholder="搜索对象"
          @update:model-value="(value) => privateBinding(ceiling, value)"
        />
      </div>
      <biz-iam-duration-fields
        v-model:valid-from="draft.validFrom"
        v-model:valid-until="draft.validUntil"
        v-model:max-assignment-duration="duration"
        show-max-duration
      />
      <biz-iam-preview-alert v-if="preview" :preview="preview" />
    </in-form>
    <template #footer
      ><in-button v-if="record" @in-click="privatePreview">预览影响</in-button
      ><in-button
        type="primary"
        :disabled="
          unavailable ||
          (!!record && !ready) ||
          !hasAction(
            record ? IamAction.TENANT_DELEGATION_UPDATE : IamAction.TENANT_DELEGATION_CREATE,
          )
        "
        @in-click="privateSave"
        >保存委派</in-button
      ></template
    >
  </in-drawer>
</template>
<script setup lang="ts">
import { inject } from "vue";
import {
  organizationMemberPickerKey,
  OrganizationMemberScene,
  type OrganizationMemberBrowseLoader,
} from "../organizationMemberPicker";
import { ref, computed, watch, toRaw } from "vue";
import {
  refreshSessionPermissions,
  useCapabilities,
  Message,
  confirmUnsavedChanges,
} from "@ingot/admin-core";
import {
  IamAction,
  formatScopeKinds,
  ScopeKind,
  ScopeBindingKind,
  type TenantDelegationApis,
  type TenantAssignmentApis,
  type TenantDelegationInput,
  type TenantDelegationRecord,
  type ResourceDetail,
  type ResourceScopeCeiling,
  type Preview,
  type ReferenceImpactPreview,
  type CurrentRoleParameter,
  type AuthorizationCandidatesApi,
} from "../../models/iam";
import BizIamDelegationCandidatePicker from "../BizIamDelegationCandidatePicker.vue";
import BizIamDurationFields from "../BizIamDurationFields.vue";
import BizIamPreviewAlert from "../BizIamPreviewAlert.vue";
import { iamEditorFailure } from "../../hooks/iamEditorFailure";
const props = defineProps<{
  apis: TenantDelegationApis;
  assignmentApis: TenantAssignmentApis;
  departmentCandidates: AuthorizationCandidatesApi;
}>();
const emits = defineEmits<{ success: [] }>();
const blank = (): TenantDelegationInput => ({
  administratorMemberId: "",
  allowedRoleIds: [],
  recipientSelection: { members: [], departments: [] },
  resourceScopeCeilings: [],
  maxAssignmentDuration: "P7D",
  assignmentDurationMode: "LIMITED",
});
const visible = ref(false),
  loading = ref(false),
  draft = ref(blank()),
  record = ref<ResourceDetail<TenantDelegationRecord>>(),
  preview = ref<Preview<ReferenceImpactPreview>>(),
  previewed = ref(""),
  resourceNames = ref<Record<string, string>>({}),
  capabilities = ref<Record<string, ScopeKind[]>>({}),
  parameters = ref<CurrentRoleParameter[]>([]),
  departmentNames = ref<Record<string, string>>({});
let epoch = 0;
let roleEpoch = 0;
const { unavailable, contextEpoch, hasAction } = useCapabilities();
const initial = ref("");
const privateBeforeClose = (done: () => void) => {
  if (loading.value) return;
  if (initial.value === fingerprint.value) done();
  else
    void confirmUnsavedChanges().then((allowed) => {
      if (allowed) done();
    });
};
const fingerprint = computed(() => JSON.stringify(draft.value));
const ready = computed(() => preview.value?.valid && previewed.value === fingerprint.value);
const duration = computed({
  get: () => draft.value.maxAssignmentDuration,
  set: (value: string | undefined) => {
    draft.value.maxAssignmentDuration = value || "";
  },
});
const departmentIds = computed({
  get: () => draft.value.recipientSelection.departments.map((d) => d.id),
  set: (ids: string | string[]) => {
    const values = Array.isArray(ids) ? ids : ids ? [ids] : [];
    draft.value.recipientSelection.departments = values.map(
      (id) =>
        draft.value.recipientSelection.departments.find((d) => d.id === id) || {
          id,
          includeDescendants: false,
        },
    );
  },
});
const memberPickerContext = inject(organizationMemberPickerKey, undefined);
const loadMemberBrowse = computed<OrganizationMemberBrowseLoader | undefined>(() =>
  memberPickerContext?.browse
    ? (params) =>
        memberPickerContext.browse!({
          ...params,
          scene: OrganizationMemberScene.ASSIGNMENT,
          delegationGrantId: undefined,
        })
    : undefined,
);
const optionsAPI: AuthorizationCandidatesApi = async (q) => {
  const response = await props.assignmentApis.optionsAPI({
    kind: q.kind as "ROLE" | "MEMBER" | "GROUP" | "RESOURCE",
    keyword: q.keyword,
    departmentId: q.departmentId,
    ids: q.ids,
    page: q.page,
    pageSize: q.pageSize,
  });
  return {
    ...response,
    data: {
      ...response.data,
      items: response.data.items.map((item) => ({
        ...item,
        summary: item.departments?.map((department) => department.name).join("、"),
      })),
      total: Number(response.data.total || 0),
      supported: true,
    },
  };
};
const scopeAPIOf =
  (resourceId: string): AuthorizationCandidatesApi =>
  (q) =>
    props.apis.scopeAPI({
      resourceId,
      parameterKey: q.parameterKey || "",
      keyword: q.keyword,
      ids: q.ids,
      page: q.page,
      pageSize: q.pageSize,
    });
const privateRoles = async () => {
  const current = epoch;
  const currentRole = ++roleEpoch;
  try {
    const roles = await Promise.all(
      draft.value.allowedRoleIds.map((id) => props.assignmentApis.roleAPI(id)),
    );
    if (current !== epoch || currentRole !== roleEpoch) return;
    parameters.value = roles.flatMap((r) =>
      r.data.items.flatMap((action) => action.parameterDefinitions),
    );
    const actions = roles.flatMap((r) => r.data.items);
    resourceNames.value = Object.fromEntries(actions.map((a) => [a.resourceId, a.resourceName]));
    capabilities.value = Object.fromEntries(
      actions.map((a) => [a.resourceId, a.scopeCapabilities]),
    );
    draft.value.resourceScopeCeilings = Object.keys(resourceNames.value).map(
      (resourceId) =>
        draft.value.resourceScopeCeilings.find((c) => c.resourceId === resourceId) || {
          resourceId,
          scopes: [],
          scopeBindings: {},
        },
    );
  } catch (error) {
    iamEditorFailure(error);
  }
};
const privateScope = (ceiling: ResourceScopeCeiling, kind: ScopeKind) => {
  const parameter = parameters.value.find(
    (p) =>
      p.resourceId === ceiling.resourceId &&
      p.kind ===
        (kind === ScopeKind.MANAGED_DEPARTMENTS
          ? ScopeBindingKind.DEPARTMENTS
          : ScopeBindingKind.OBJECTS),
  );
  ceiling.scopes = [
    {
      kind,
      ...(kind === ScopeKind.MANAGED_DEPARTMENTS || kind === ScopeKind.OBJECT_SET
        ? { parameterKey: parameter?.key }
        : {}),
    },
  ];
  ceiling.scopeBindings =
    (kind === ScopeKind.MANAGED_DEPARTMENTS || kind === ScopeKind.OBJECT_SET) && parameter
      ? { [parameter.key]: { kind: parameter.kind, ids: [] } }
      : {};
};
const privateBinding = (ceiling: ResourceScopeCeiling, value: string | string[]) => {
  const key = ceiling.scopes[0]?.parameterKey;
  if (!key) return;
  ceiling.scopeBindings[key] = {
    kind:
      ceiling.scopes[0].kind === ScopeKind.MANAGED_DEPARTMENTS
        ? ScopeBindingKind.DEPARTMENTS
        : ScopeBindingKind.OBJECTS,
    ids: Array.isArray(value) ? value : value ? [value] : [],
  };
};
watch(
  () => draft.value.allowedRoleIds.join(","),
  () => void privateRoles(),
);
watch(contextEpoch, () => {
  epoch += 1;
  visible.value = false;
});
const show = async (row?: ResourceDetail<TenantDelegationRecord>) => {
  epoch += 1;
  record.value = row;
  draft.value = row ? structuredClone(toRaw(row.record.delegation)) : blank();
  preview.value = undefined;
  previewed.value = "";
  visible.value = true;
  initial.value = fingerprint.value;
  void privateRoles();
};
const privatePreview = async () => {
  if (!record.value) return;
  const mark = fingerprint.value;
  const current = epoch;
  try {
    const response = (
      await props.apis.previewAPI(record.value.record.id, {
        expectedVersion: record.value.version,
        delegation: draft.value,
      })
    ).data;
    if (current !== epoch) return;
    preview.value = response;
    previewed.value = mark;
  } catch (error) {
    iamEditorFailure(error);
  }
};
const privateSave = async () => {
  if (
    unavailable.value ||
    (record.value && !ready.value) ||
    !hasAction(
      record.value ? IamAction.TENANT_DELEGATION_UPDATE : IamAction.TENANT_DELEGATION_CREATE,
    )
  )
    return;
  const current = epoch;
  loading.value = true;
  try {
    if (record.value)
      await props.apis.updateAPI(record.value.record.id, {
        expectedVersion: record.value.version,
        delegation: draft.value,
      });
    else await props.apis.createAPI(draft.value);
    await refreshSessionPermissions({ refreshMenusIfVersionChanged: true }).catch(() =>
      Message.warning("已保存，权限刷新暂不可用，请稍后重试"),
    );
    if (current !== epoch) return;
    Message.success("已保存委派");
    visible.value = false;
    emits("success");
  } catch (error) {
    previewed.value = "";
    iamEditorFailure(error);
  } finally {
    if (current === epoch) loading.value = false;
  }
};
defineExpose({ show });
</script>
