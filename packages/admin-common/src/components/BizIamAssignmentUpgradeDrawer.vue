<template>
  <in-drawer
    v-model="visible"
    title="升级角色分配版本"
    size="100%"
    layout="pinned"
    padding="0"
    close-position="start"
    :loading="loading"
  >
    <div v-if="visible" class="in-wizard-frame flex h-full min-h-0">
      <biz-iam-wizard-nav :steps="steps" :current="step" />
      <section class="flex-1 min-w-0 min-h-0 flex flex-col px-48px py-24px">
        <div class="mb-24px text-18px">{{ steps[step].title }}</div>
        <div class="flex-1 min-h-0 overflow-auto max-w-900px">
          <template v-if="step === 0">
            <el-alert
              class="mb-24px"
              title="保留接收对象、原有效期和来源委派；一次仅升级同角色的分配。委派须先加入目标版本及其操作上限。"
              type="info"
              :closable="false"
            />
            <div
              v-for="row in rows"
              :key="row.record.id"
              class="p-12px mb-8px rounded-8px bg-[var(--in-permission-panel-bg)]"
            >
              {{ row.record.subjectName || row.record.assignment.subject.id }} ·
              {{ row.record.roleName }} · v{{
                row.record.revisionNumber || row.record.assignment.roleRevisionRef.id
              }}<br /><span class="text-12px"
                >{{ formatDateTime(row.record.assignment.validFrom, { fallback: "立即" }) }} 至
                {{ formatDateTime(row.record.assignment.validUntil, { fallback: "长期" }) }} ·
                {{ row.record.delegationSummary || "直接分配" }}</span
              >
            </div>
          </template>
          <in-form v-else-if="step === 1" label-position="top">
            <el-form-item label="目标角色版本" required
              ><biz-iam-delegation-role-picker
                v-model="targetOptions"
                :tree-api="treeApi"
                :detail-api="candidatesApi"
                :reset-key="session"
                one-version-per-role
                title="选择升级目标版本"
                placeholder="请选择同角色更高版本"
            /></el-form-item>
            <div class="text-12px">
              默认选择当前可用的最新已发布版本；保存固定该版本，后续发布不会自动替换。
            </div>
          </in-form>
          <template v-else-if="step === 2">
            <el-alert
              class="mb-24px"
              title="仅复用参数键、类型和实际资源都相同的绑定。新增或含义变化的范围必须重新配置。"
              type="info"
              :closable="false"
            />
            <div v-for="(row, index) in rows" :key="row.record.id" class="mb-24px">
              <div class="mb-12px text-16px">
                {{ row.record.subjectName || row.record.assignment.subject.id }}
              </div>
              <biz-iam-assignment-scope-step
                v-if="drafts[index]"
                v-model:roles="drafts[index]"
                :api="candidatesApiFor(row.record.id)"
                :reset-key="session"
              />
            </div>
          </template>
          <template v-else>
            <biz-iam-preview-alert :preview="previewState.preview.value" />
            <div
              v-for="item in previewState.preview.value?.effectiveResult?.items || []"
              :key="item.id"
              class="p-16px mt-16px rounded-8px bg-[var(--in-permission-panel-bg)]"
            >
              <div>{{ subjectLabel(item.id) }} · {{ item.allowed ? "可以升级" : "不能升级" }}</div>
              <div class="mt-8px text-12px">
                新增 {{ added(item).length }} 项操作，移除
                {{ removed(item).length }} 项操作；范围变化 {{ changed(item).length }} 项。
              </div>
              <div v-for="action in added(item)" :key="'add' + action.actionId" class="mt-4px">
                新增：{{ actionLabel(action.actionId) }}
              </div>
              <div v-for="action in removed(item)" :key="'remove' + action.actionId" class="mt-4px">
                移除：{{ actionLabel(action.actionId) }}
              </div>
              <div v-for="action in changed(item)" :key="'change' + action.actionId" class="mt-4px">
                范围变化：{{ actionLabel(action.actionId) }} · {{ scopeText(action) }}
              </div>
              <div
                v-for="entry in fieldPermissionChanges(
                  item.beforeFieldPermissions,
                  item.afterFieldPermissions,
                )"
                :key="entry.key"
                class="mt-4px"
              >
                字段变化 · 资源 {{ entry.resourceId }} / {{ entry.field }}：{{ entry.before }} →
                {{ entry.after }}
              </div>
              <div v-for="entry in bindingChanges(item)" :key="entry.key" class="mt-4px">
                对象范围 {{ entry.key }}：{{ entry.before }} → {{ entry.after }}
              </div>
              <div
                v-for="issue in item.issues"
                :key="issue.path + issue.message"
                class="mt-8px text-[var(--el-color-warning)]"
              >
                {{ issue.message }}
              </div>
            </div>
          </template>
          <el-alert
            v-if="failure"
            class="mt-16px"
            :title="failure"
            type="warning"
            :closable="false"
          />
        </div>
      </section>
    </div>
    <template #footer>
      <in-button :disabled="saving" @in-click="visible = false">取消</in-button>
      <in-button v-if="step > 0" :disabled="saving" @in-click="step--">上一步</in-button>
      <in-button
        v-if="step < 3"
        type="primary"
        :disabled="loading || saving || (step === 1 && targetOptions.length !== 1)"
        @in-click="next"
        >下一步</in-button
      >
      <in-button
        v-if="step === 3"
        :loading="previewState.loading.value"
        :disabled="saving"
        @in-click="runPreview"
        >预览影响</in-button
      >
      <in-button
        v-if="step === 3 && previewState.preview.value?.valid"
        type="primary"
        :loading="saving"
        @in-click="save"
        >确认升级</in-button
      >
    </template>
  </in-drawer>
</template>
<script setup lang="ts">
import { formatDateTime } from "@ingot/shared";
import { fieldPermissionChanges } from "../models/iam/roleFields";
import { Message, useCapabilities } from "@ingot/admin-core";
import {
  type ResourceDetail,
  type AssignmentRecord,
  type AuthorizationOption,
  type AuthorizationCandidatesApi,
  type AuthorizationRoleCandidatesApi,
  type AssignmentUpgradePreviewApi,
  type AssignmentUpgradeApi,
  type AssignmentUpgradeInput,
  type AssignmentUpgradeItem,
  type ActionGrant,
} from "../models/iam";
import {
  assignmentScopeIssues,
  type PlatformAssignmentRoleDraft,
} from "../models/iam/platformAssignment";
import { useIamDraftPreview } from "../hooks/useIamDraftPreview";
import { iamEditorFailure } from "../hooks/iamEditorFailure";
import BizIamWizardNav from "./BizIamWizardNav.vue";
import BizIamDelegationRolePicker from "./BizIamDelegationRolePicker.vue";
import BizIamAssignmentScopeStep from "./BizIamAssignmentScopeStep.vue";
import BizIamPreviewAlert from "./BizIamPreviewAlert.vue";
const props = defineProps<{
  roleCandidatesApi: (id: string) => AuthorizationRoleCandidatesApi;
  candidatesApi: (id: string) => AuthorizationCandidatesApi;
  previewApi: AssignmentUpgradePreviewApi;
  saveApi: AssignmentUpgradeApi;
}>();
const emits = defineEmits<{ success: [] }>();
const { contextEpoch } = useCapabilities();
const visible = ref(false);
const loading = ref(false);
const saving = ref(false);
const step = ref(0);
const session = ref(0);
const failure = ref("");
const rows = ref<ResourceDetail<AssignmentRecord>[]>([]);
const targetOptions = ref<AuthorizationOption[]>([]);
const drafts = ref<PlatformAssignmentRoleDraft[][]>([]);
const oldOptions = ref<AuthorizationOption[]>([]);
const steps = [
  { title: "确认分配", description: "保留主体、期限与来源" },
  { title: "目标版本", description: "选择更高的固定版本" },
  { title: "设置范围", description: "配置新增或变化的参数" },
  { title: "预览影响", description: "核对差异后整批升级" },
];
const treeApi: AuthorizationRoleCandidatesApi = (query) =>
  props.roleCandidatesApi(rows.value[0].record.id)(query);
const candidatesApi: AuthorizationCandidatesApi = (query) =>
  props.candidatesApi(rows.value[0].record.id)(query);
const candidatesApiFor =
  (id: string): AuthorizationCandidatesApi =>
  (query) =>
    props.candidatesApi(id)(query);
const previewState = useIamDraftPreview<
  AssignmentUpgradeInput,
  import("../models/iam").AssignmentUpgradeResult
>({ contextEpoch, preview: async (input) => (await props.previewApi(input)).data });
watch(
  [targetOptions, drafts],
  () => {
    previewState.bumpDraft();
    failure.value = "";
  },
  { deep: true, flush: "sync" },
);
watch(contextEpoch, () => {
  visible.value = false;
  session.value++;
  previewState.bumpDraft();
});
const input = (reuse = false): AssignmentUpgradeInput => ({
  targetRevisionRef: targetOptions.value[0].roleRevisionRef!,
  items: rows.value.map((row, index) => ({
    id: row.record.id,
    expectedVersion: row.version,
    ...(!reuse ? { scopeBindings: drafts.value[index]?.[0]?.bindings || {} } : {}),
  })),
});
const open = async (selected: ResourceDetail<AssignmentRecord>[]) => {
  if (!selected.length) return;
  rows.value = selected;
  targetOptions.value = [];
  drafts.value = [];
  oldOptions.value = [];
  failure.value = "";
  step.value = 0;
  visible.value = true;
  previewState.bumpDraft();
  const current = ++session.value;
  loading.value = true;
  try {
    const root = await treeApi({ page: 1, pageSize: 20 });
    const role = root.data.items[0];
    if (!role) throw new Error("没有可升级角色");
    const versions = await treeApi({ roleId: role.id, page: 1, pageSize: 20 });
    const latest = versions.data.items.find(
      (item) =>
        (item.revisionNumber || 0) >
        Math.max(...selected.map((row) => Number(row.record.revisionNumber || 0))),
    );
    if (!latest) throw new Error("没有更高的可用版本；委派须先加入目标版本");
    const details = await candidatesApi({
      kind: "ROLE_REVISION",
      ids: [latest.id],
      page: 1,
      pageSize: 20,
    });
    if (current !== session.value) return;
    const option = details.data.items[0];
    if (!option) throw new Error("目标版本不可用");
    targetOptions.value = [{ ...option, roleNode: latest }];
    const previous = await candidatesApi({
      kind: "ROLE_REVISION",
      ids: [...new Set(selected.map((row) => row.record.assignment.roleRevisionRef.id))],
      page: 1,
      pageSize: 100,
    });
    if (current === session.value) oldOptions.value = previous.data.items;
  } catch (error) {
    if (current === session.value) {
      failure.value = error instanceof Error ? error.message : "加载失败，请重新打开重试";
      await iamEditorFailure(error);
    }
  } finally {
    if (current === session.value) loading.value = false;
  }
};
const next = async () => {
  if (step.value === 1) {
    loading.value = true;
    const current = session.value;
    const target = targetOptions.value[0];
    try {
      const result = await props.previewApi(input(true));
      if (current !== session.value || targetOptions.value[0]?.id !== target.id) return;
      drafts.value = rows.value.map((row) => {
        const item = result.data.effectiveResult?.items.find((item) => item.id === row.record.id);
        if (!item) throw new Error("范围资料不完整");
        return [
          { option: target, bindings: structuredClone(item.scopeBindings), selectedObjects: {} },
        ];
      });
      if (drafts.value.length !== rows.value.length) throw new Error("范围资料不完整");
      step.value++;
    } catch (error) {
      failure.value = "升级范围加载失败，草稿已保留，请重试";
      await iamEditorFailure(error);
    } finally {
      loading.value = false;
    }
    return;
  }
  if (step.value === 2) {
    const issues = drafts.value.flatMap((roles) => assignmentScopeIssues(roles));
    if (issues.length) {
      failure.value = issues.join("；");
      return;
    }
  }
  step.value++;
};
const runPreview = async () => {
  try {
    await previewState.runPreview(input());
  } catch (error) {
    await iamEditorFailure(error);
    failure.value = "预览失败，草稿已保留，请重试";
  }
};
const save = async () => {
  if (saving.value || !previewState.preview.value?.valid) return;
  saving.value = true;
  try {
    await props.saveApi(input());
    Message.success("角色分配已升级");
    visible.value = false;
    emits("success");
  } catch (error) {
    previewState.bumpDraft();
    await iamEditorFailure(error);
    failure.value = "升级失败，整批未保存；草稿已保留，请核对版本并重新预览";
  } finally {
    saving.value = false;
  }
};
const subjectLabel = (id: string) =>
  rows.value.find((row) => row.record.id === id)?.record.subjectName || id;
const added = (item: AssignmentUpgradeItem) =>
  item.after.filter((action) => !item.before.some((old) => old.actionId === action.actionId));
const removed = (item: AssignmentUpgradeItem) =>
  item.before.filter((action) => !item.after.some((next) => next.actionId === action.actionId));
const changed = (item: AssignmentUpgradeItem) =>
  item.after.filter((action) => {
    const old = item.before.find((old) => old.actionId === action.actionId);
    return old && JSON.stringify(old.scopes) !== JSON.stringify(action.scopes);
  });
const bindingChanges = (item: AssignmentUpgradeItem) => {
  const before =
    rows.value.find((row) => row.record.id === item.id)?.record.assignment.scopeBindings || {};
  const keys = [...new Set([...Object.keys(before), ...Object.keys(item.scopeBindings)])];
  return keys
    .filter((key) => JSON.stringify(before[key]) !== JSON.stringify(item.scopeBindings[key]))
    .map((key) => ({
      key,
      before: before[key]?.ids.join("、") || "未配置",
      after: item.scopeBindings[key]?.ids.join("、") || "未配置",
    }));
};
const actionLabel = (id: string) => {
  const action = [...targetOptions.value, ...oldOptions.value]
    .flatMap((option) => option.actions || [])
    .find((action) => action.id === id);
  return action
    ? `${action.applicationName} / ${action.resourceName} / ${action.name}`
    : `操作 ${id}`;
};
const scopeText = (action: ActionGrant) =>
  action.scopes
    .map((scope) =>
      scope.kind === "ALL"
        ? "全部"
        : scope.kind === "SELF"
          ? "本人"
          : scope.kind === "OBJECT_SET"
            ? "指定对象"
            : scope.kind,
    )
    .join("、");
defineExpose({ open });
</script>
