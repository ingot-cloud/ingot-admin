<template>
  <in-drawer
    v-model="visible"
    title="分配角色"
    size="720px"
    :loading="loading"
    :before-close="privateBeforeClose"
  >
    <in-form>
      <el-form-item v-if="sources.length" label="分配来源"
        ><el-select v-model="sourceId" placeholder="请选择本人的委派来源"
          ><el-option v-if="canAssignDirectly" label="直接治理" value="" /><el-option
            v-for="source in sources"
            :key="source.id"
            :value="source.id"
            :label="`${source.allowedRoles.map((role) => role.name).join('、')} · ${source.recipientSummary} · ${source.maxAssignmentDuration}`" /></el-select
      ></el-form-item>
      <el-alert
        v-if="selectedSource"
        type="info"
        :closable="false"
        :title="`来源约束：${selectedSource.recipientSummary}；最长 ${selectedSource.maxAssignmentDuration}`"
      />
      <el-form-item label="角色" required
        ><biz-iam-delegation-candidate-picker
          v-model="draft.roleId"
          :api="optionsAPI"
          :query="{ kind: 'ROLE' }"
          title="选择角色"
          placeholder="请选择当前角色"
          search-placeholder="搜索角色名称"
      /></el-form-item>
      <in-button text @in-click="privateRole">刷新当前角色范围</in-button>
      <el-alert
        v-if="record?.record.assignment.delegationGrantId"
        title="修改来源将重新计算范围；请核对原委派上限及期限"
        type="warning"
        :closable="false"
      />
      <el-form-item label="接收对象类型"
        ><el-select v-model="draft.subject.type" placeholder="请选择主体类型"
          ><el-option label="成员" :value="SubjectType.MEMBER" /><el-option
            label="用户组"
            :value="SubjectType.GROUP" /></el-select
      ></el-form-item>
      <el-form-item label="接收对象" required
        ><biz-iam-delegation-candidate-picker
          v-model="draft.subject.id"
          :key="`${sourceId}:${draft.subject.type}`"
          :api="optionsAPI"
          :query="{ kind: draft.subject.type }"
          title="选择接收对象"
          placeholder="请选择成员或用户组"
          search-placeholder="搜索名称"
      /></el-form-item>
      <el-form-item
        v-for="parameter in definition?.definition.parameterDefinitions || []"
        :key="parameter.key"
        :label="`${parameter.kind === 'DEPARTMENTS' ? '管理部门' : '指定对象'} · ${definition?.items.find((item) => item.resourceId === parameter.resourceId)?.resourceName || '资源'}`"
      >
        <biz-iam-delegation-candidate-picker
          :model-value="draft.scopeBindings[parameter.key]?.ids || []"
          :api="scopeAPI"
          :query="{ kind: 'OBJECT', parameterKey: parameter.key }"
          multiple
          title="配置数据范围"
          placeholder="请选择允许的数据范围"
          search-placeholder="搜索对象"
          @update:model-value="(value) => privateBinding(parameter.key, parameter.kind, value)"
        />
      </el-form-item>
      <biz-iam-duration-fields
        v-model:valid-from="draft.validFrom"
        v-model:valid-until="draft.validUntil"
      />
      <biz-iam-preview-alert v-if="preview" :preview="preview" />
    </in-form>
    <template #footer
      ><in-button :disabled="unavailable" @in-click="privatePreview">预览</in-button
      ><in-button type="primary" :disabled="!ready || unavailable" @in-click="privateSave"
        >保存，立即生效</in-button
      ></template
    >
  </in-drawer>
</template>
<script setup lang="ts">
import { ref, computed, watch, toRaw } from "vue";
import {
  refreshSessionPermissions,
  useCapabilities,
  Message,
  confirmUnsavedChanges,
} from "@ingot/admin-core";
import {
  IamAction,
  SubjectType,
  type TenantAssignmentApis,
  type TenantAssignmentInput,
  type TenantAssignmentRecord,
  type ResourceDetail,
  type TenantDelegationMine,
  type CurrentRoleGrantList,
  type Preview,
  type AssignmentPreviewResult,
  type AuthorizationCandidatesApi,
  type ScopeBindingKind,
} from "../../models/iam";
import BizIamDelegationCandidatePicker from "../BizIamDelegationCandidatePicker.vue";
import BizIamDurationFields from "../BizIamDurationFields.vue";
import BizIamPreviewAlert from "../BizIamPreviewAlert.vue";
import { iamEditorFailure } from "../../hooks/iamEditorFailure";
const props = defineProps<{ apis: TenantAssignmentApis }>();
const emits = defineEmits<{ success: [] }>();
const blank = (): TenantAssignmentInput => ({
  subject: { type: SubjectType.MEMBER, id: "" },
  roleId: "",
  scopeBindings: {},
});
const visible = ref(false),
  loading = ref(false),
  sourceId = ref(""),
  draft = ref(blank()),
  record = ref<ResourceDetail<TenantAssignmentRecord>>(),
  sources = ref<TenantDelegationMine[]>([]),
  definition = ref<CurrentRoleGrantList>(),
  preview = ref<Preview<AssignmentPreviewResult>>(),
  previewed = ref("");
let epoch = 0;
let roleEpoch = 0;
let initializing = false;
const { unavailable, contextEpoch, hasAction } = useCapabilities();
const initial = ref("");
const privateBeforeClose = (done: () => void) => {
  if (loading.value) return;
  if (initial.value === fingerprint.value) done();
  else {
    const current = epoch;
    void confirmUnsavedChanges().then((allowed) => {
      if (allowed && current === epoch) done();
    });
  }
};
const fingerprint = computed(() => JSON.stringify(draft.value));
const ready = computed(() => preview.value?.valid && previewed.value === fingerprint.value);
const canAssignDirectly = computed(
  () =>
    !sources.value.length ||
    sources.value.some((source) =>
      source.directAssignmentActions?.includes(
        record.value ? IamAction.TENANT_ASSIGNMENT_UPDATE : IamAction.TENANT_ASSIGNMENT_CREATE,
      ),
    ),
);
const selectedSource = computed(() => sources.value.find((s) => s.id === sourceId.value));
const optionsAPI: AuthorizationCandidatesApi = async (q) => {
  const response = await props.apis.optionsAPI({
    kind: q.kind as "ROLE" | "MEMBER" | "GROUP" | "RESOURCE",
    delegationGrantId: sourceId.value || undefined,
    keyword: q.keyword,
    ids: q.ids,
    page: q.page,
    pageSize: q.pageSize,
  });
  return {
    ...response,
    data: { ...response.data, total: Number(response.data.total || 0), supported: true },
  };
};
const scopeAPI: AuthorizationCandidatesApi = (q) =>
  props.apis.scopeAPI({
    roleId: draft.value.roleId,
    parameterKey: q.parameterKey || "",
    delegationGrantId: sourceId.value || undefined,
    keyword: q.keyword,
    ids: q.ids,
    page: q.page,
    pageSize: q.pageSize,
    tree: q.tree,
    parentId: q.parentId,
  });
const privateBinding = (key: string, kind: ScopeBindingKind, value: string | string[]) => {
  draft.value.scopeBindings[key] = {
    kind,
    ids: Array.isArray(value) ? value : value ? [value] : [],
  };
};
const privateRole = async () => {
  const currentRole = ++roleEpoch;
  if (!draft.value.roleId) {
    definition.value = undefined;
    return;
  }
  const current = epoch;
  try {
    const response = await props.apis.roleAPI(draft.value.roleId, sourceId.value || undefined);
    if (current !== epoch || currentRole !== roleEpoch) return;
    definition.value = response.data;
    const existing = draft.value.scopeBindings;
    draft.value.scopeBindings = Object.fromEntries(
      response.data.definition.parameterDefinitions.map((p) => [
        p.key,
        existing[p.key]?.kind === p.kind ? existing[p.key] : { kind: p.kind, ids: [] },
      ]),
    );
  } catch (error) {
    if (current !== epoch || currentRole !== roleEpoch) return;
    definition.value = undefined;
    void iamEditorFailure(error);
  }
};
watch(
  () => draft.value.roleId,
  () => void privateRole(),
);
watch(
  sourceId,
  () => {
    if (initializing) return;
    draft.value.delegationGrantId = sourceId.value || undefined;
    draft.value.subject.id = "";
    draft.value.scopeBindings = {};
    if (
      sourceId.value &&
      !selectedSource.value?.allowedRoles.some((role) => role.id === draft.value.roleId)
    )
      draft.value.roleId = "";
    preview.value = undefined;
    previewed.value = "";
    void privateRole();
  },
  { flush: "sync" },
);
watch(contextEpoch, () => {
  epoch += 1;
  visible.value = false;
});
const show = async (row?: ResourceDetail<TenantAssignmentRecord>) => {
  initializing = true;
  const current = ++epoch;
  roleEpoch += 1;
  record.value = row;
  draft.value = row ? structuredClone(toRaw(row.record.assignment)) : blank();
  sourceId.value = draft.value.delegationGrantId || "";
  preview.value = undefined;
  previewed.value = "";
  visible.value = true;
  initial.value = fingerprint.value;
  initializing = false;
  try {
    const response = await props.apis.mineAPI();
    if (current !== epoch) return;
    sources.value = response.data;
    if (!row && !canAssignDirectly.value && sources.value.length)
      sourceId.value = sources.value[0].id;
  } catch (error) {
    iamEditorFailure(error);
  }
  void privateRole();
};
const privatePreview = async () => {
  const mark = fingerprint.value;
  const current = epoch;
  loading.value = true;
  try {
    const response = await props.apis.previewAPI({ items: [draft.value] });
    if (current !== epoch) return;
    preview.value = response.data;
    previewed.value = mark;
  } catch (error) {
    if (current !== epoch) return;
    void iamEditorFailure(error);
  } finally {
    if (current === epoch) loading.value = false;
  }
};
const privateSave = async () => {
  if (
    !ready.value ||
    unavailable.value ||
    !hasAction(
      record.value ? IamAction.TENANT_ASSIGNMENT_UPDATE : IamAction.TENANT_ASSIGNMENT_CREATE,
    )
  )
    return;
  const current = epoch;
  loading.value = true;
  try {
    if (record.value)
      await props.apis.updateAPI(record.value.record.id, {
        expectedVersion: record.value.version,
        assignment: draft.value,
      });
    else await props.apis.createAPI({ items: [draft.value] });
    await refreshSessionPermissions({ refreshMenusIfVersionChanged: true }).catch(() =>
      Message.warning("已保存，权限刷新暂不可用，请稍后重试"),
    );
    if (current !== epoch) return;
    Message.success("已保存角色分配");
    visible.value = false;
    emits("success");
  } catch (error) {
    previewed.value = "";
    if (current !== epoch) return;
    void iamEditorFailure(error);
  } finally {
    if (current === epoch) loading.value = false;
  }
};
defineExpose({ show });
</script>
