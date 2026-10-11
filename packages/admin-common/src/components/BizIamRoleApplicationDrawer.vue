<template>
  <in-drawer v-model="visible" title="应用角色版本" size="100%" layout="pinned" padding="0">
    <div class="in-wizard-frame flex h-full min-h-0">
      <biz-iam-wizard-nav :steps="steps" :current="step" />
      <section class="flex-1 min-w-0 min-h-0 flex flex-col application-content">
        <div class="shrink-0 mb-16px flex flex-wrap gap-12px items-center">
          <span class="text-18px">{{ steps[step].title }}</span>
          <in-tag v-if="target" :value="{ text: target.name, tag: 'info' }" />
          <in-tag
            v-if="task"
            :value="{
              text: taskLabels[task.status],
              tag:
                task.status === 'SUCCEEDED'
                  ? 'success'
                  : task.status === 'PAUSED' || task.status === 'BLOCKED'
                    ? 'warning'
                    : 'info',
            }"
          />
        </div>
        <el-alert v-if="failure" class="mb-16px" :title="failure" type="error" :closable="false" />
        <in-loading :loading="loading" class="flex-1 min-h-0 overflow-auto">
          <template v-if="step === 0">
            <in-form label-position="top">
              <el-form-item label="处理集合" required>
                <el-radio-group v-model="selection">
                  <el-radio value="ALL">全部关联分配</el-radio>
                  <el-radio value="SOURCE_REVISIONS">指定来源版本</el-radio>
                  <el-radio value="ASSIGNMENTS">指定分配</el-radio>
                </el-radio-group>
              </el-form-item>
            </in-form>
            <el-alert
              title="成员直接分配和用户组分配按原记录切换，保留主体、生效时间、期限和委派来源。快照建立后新增的分配不自动纳入。"
              type="info"
              :closable="false"
              class="mb-16px"
            />
            <div v-if="selection === 'SOURCE_REVISIONS'" class="embedded-table">
              <div class="mb-12px">已选择 {{ sourceIds.length }} 个来源版本</div>
              <in-table
                :data="revisionPage.records || []"
                :page="revisionPage"
                :headers="revisionHeaders"
                :row-key="(row: ResourceDetail<RoleRevision>) => row.record.id"
                density="compact"
                @handleCurrentChange="privateRevisionPage($event.value)"
                @handleSizeChange="privateRevisionSize($event.value)"
              >
                <template #select="{ item }"
                  ><el-checkbox
                    :model-value="sourceIds.includes(asRevision(item).record.id)"
                    @change="privateToggle(sourceIds, asRevision(item).record.id, $event)"
                /></template>
                <template #version="{ item }">{{
                  roleVersionLabel(asRevision(item).record)
                }}</template>
                <template #remark="{ item }">{{ asRevision(item).record.remark || "-" }}</template>
              </in-table>
            </div>
            <div v-else-if="selection === 'ASSIGNMENTS'" class="embedded-table">
              <div class="mb-12px">已选择 {{ assignmentIds.length }} 条分配</div>
              <in-table
                :data="candidatePage.records || []"
                :page="candidatePage"
                :headers="candidateHeaders"
                :row-key="(row: ResourceDetail<AssignmentRecord>) => row.record.id"
                density="compact"
                @handleCurrentChange="privateCandidatePage($event.value)"
                @handleSizeChange="privateCandidateSize($event.value)"
              >
                <template #select="{ item }"
                  ><el-checkbox
                    :model-value="assignmentIds.includes(asAssignment(item).record.id)"
                    @change="privateToggle(assignmentIds, asAssignment(item).record.id, $event)"
                /></template>
                <template #subject="{ item }"
                  >{{
                    asAssignment(item).record.assignment.subject.type === "GROUP"
                      ? "用户组"
                      : "成员"
                  }}
                  ·
                  {{
                    asAssignment(item).record.subjectName ||
                    asAssignment(item).record.assignment.subject.id
                  }}</template
                >
                <template #version="{ item }">{{
                  assignmentLabel(asAssignment(item).record)
                }}</template>
              </in-table>
            </div>
          </template>
          <template v-else-if="task">
            <div class="flex flex-wrap gap-12px mb-16px" aria-live="polite">
              <span v-for="state in itemStates" :key="state"
                >{{ itemLabels[state] }} {{ task.counts[state] || 0 }}</span
              >
            </div>
            <el-alert
              v-if="task.failureReason"
              class="mb-16px"
              :title="task.failureReason"
              type="warning"
              :closable="false"
            />
            <el-alert
              v-if="step === 1"
              class="mb-16px"
              title="兼容范围逐条保留。新增或不兼容参数需要补齐；批量覆盖只修改明确勾选的参数，其他绑定继续保留。"
              type="info"
              :closable="false"
            />
            <div
              v-if="step === 1 && editable"
              class="mt-16px mb-16px flex flex-wrap gap-8px items-center"
            >
              <span>已选择 {{ itemIds.length }} 条</span>
              <in-button :disabled="!itemIds.length" @in-click="privateOpenScope(undefined, false)">
                配置选中范围
              </in-button>
              <in-button @in-click="privateOpenScope(undefined, true)">
                配置全部待处理范围
              </in-button>
              <in-button :disabled="!itemIds.length" @in-click="privateExclude(true)">
                排除选中
              </in-button>
              <in-button :disabled="!itemIds.length" @in-click="privateExclude(false)">
                重新纳入选中</in-button
              >
              <in-button :loading="saving" @in-click="privateRefresh">重新预检未完成项</in-button>
            </div>
            <div class="embedded-table application-items">
              <in-table
                :data="itemPage.records || []"
                :page="itemPage"
                :headers="itemHeaders"
                density="compact"
                :row-key="(row: RoleApplicationItem) => row.id"
                @handleCurrentChange="privateItemsPage($event.value)"
                @handleSizeChange="privateItemsSize($event.value)"
              >
                <template #select="{ item }"
                  ><el-checkbox
                    v-if="editable && configurable(asItem(item))"
                    :model-value="itemIds.includes(asItem(item).id)"
                    @change="privateToggle(itemIds, asItem(item).id, $event)"
                /></template>
                <template #subject="{ item }"
                  >{{ subjectLabel(asItem(item)) }}
                  <div class="text-12px text-[var(--el-text-color-secondary)]">
                    {{ assignmentLabel(asItem(item).original) }}
                  </div></template
                >
                <template #status="{ item }"
                  ><in-tag
                    :value="{
                      text: itemLabels[asItem(item).status],
                      tag:
                        asItem(item).status === 'BLOCKED'
                          ? 'warning'
                          : asItem(item).status === 'SUCCEEDED'
                            ? 'success'
                            : 'info',
                    }"
                /></template>
                <template #impact="{ item }">
                  <div v-if="asItem(item).preview">
                    新增 {{ difference(asItem(item), "added") }} 项操作，移除
                    {{ difference(asItem(item), "removed") }} 项，范围变化
                    {{ difference(asItem(item), "scope") }} 项，字段变化
                    {{ fieldChanges(asItem(item)).length }} 项
                  </div>
                  <div v-if="asItem(item).failureReason" class="text-[var(--el-color-danger)]">
                    {{ asItem(item).failureReason }}
                  </div>
                  <div
                    v-for="issue in asItem(item).preview?.issues || []"
                    :key="issue.path + issue.message"
                    class="text-[var(--el-color-danger)]"
                  >
                    {{ issue.message }}
                  </div>
                </template>
                <template #actions="{ item }">
                  <in-button link @in-click="privateShowImpact(asItem(item))">查看差异</in-button>
                  <in-button
                    v-if="step === 1 && editable && configurable(asItem(item))"
                    link
                    type="primary"
                    @in-click="privateOpenScope(asItem(item), false)"
                    >配置范围</in-button
                  >
                </template>
              </in-table>
            </div>
            <div v-if="step === 3" class="mt-16px">
              <el-alert
                :title="
                  task.status === 'SUCCEEDED'
                    ? '全部纳入的分配已完成应用，已排除或已失效记录未改写。'
                    : task.status === 'PAUSED'
                      ? '执行已暂停，已提交批次保留。重新预检未完成项并再次确认后继续。'
                      : '任务已保存，正在异步分批执行。关闭页面不会中止任务。'
                "
                :type="task.status === 'SUCCEEDED' ? 'success' : 'info'"
                :closable="false"
              />
              <in-button class="mt-12px" @in-click="privateLoadTask">刷新进度</in-button>
              <in-button
                v-if="task.status === 'PAUSED' || task.status === 'BLOCKED'"
                class="mt-12px ml-8px"
                @in-click="privateResume"
                >继续处理</in-button
              >
            </div>
          </template>
        </in-loading>
      </section>
    </div>
    <template #footer>
      <in-button v-if="step > 1 && step < 3" @in-click="step--">上一步</in-button>
      <in-button
        v-if="step === 0"
        type="primary"
        :loading="saving"
        :disabled="!canPrepare"
        @in-click="privatePrepare"
        >建立快照并配置范围</in-button
      >
      <in-button v-else-if="step === 1" type="primary" @in-click="step = 2">预览影响</in-button>
      <in-button
        v-else-if="step === 2"
        type="primary"
        :loading="saving"
        :disabled="task?.status !== 'READY'"
        @in-click="privateConfirm"
        >确认执行</in-button
      >
      <in-button v-else @in-click="visible = false">关闭</in-button>
    </template>
  </in-drawer>
  <in-dialog
    v-model="scopeVisible"
    title="配置应用范围"
    width="min(800px, calc(100vw - 32px))"
    layout="pinned"
  >
    <el-alert
      v-if="scopeAll || scopeItemIds.length > 1"
      title="请明确勾选要覆盖的参数。覆盖前会对每条分配重新验证资源归属和委派上限。"
      type="warning"
      :closable="false"
      class="mb-16px"
    />
    <el-checkbox-group
      v-if="scopeAll || scopeItemIds.length > 1"
      v-model="overwriteKeys"
      class="mb-16px"
    >
      <el-checkbox
        v-for="parameter in target?.parameterDefinitions || []"
        :key="parameter.key"
        :value="parameter.key"
        >覆盖 {{ parameter.key }}</el-checkbox
      >
    </el-checkbox-group>
    <biz-iam-assignment-scope-step
      v-if="scopeRoles.length && scopeAssignment"
      v-model:roles="scopeRoles"
      :api="api.scopeCandidates(scopeAssignment)"
      :selected-api="api.scopeCandidates(scopeAssignment)"
      :reset-key="scopeSession"
    />
    <div v-if="!target?.parameterDefinitions?.length">该版本无需绑定范围参数。</div>
    <template #footer>
      <in-button @in-click="scopeVisible = false">取消</in-button>
      <in-button
        type="primary"
        :loading="saving"
        :disabled="!overwriteKeys.length"
        @in-click="privateSaveScope"
        >确认覆盖并预检</in-button
      >
    </template>
  </in-dialog>
  <in-dialog
    v-model="impactVisible"
    title="分配应用差异"
    width="min(840px, calc(100vw - 32px))"
    layout="pinned"
  >
    <template v-if="impactItem">
      <div class="mb-12px">
        {{ subjectLabel(impactItem) }} · {{ assignmentLabel(impactItem.original) }} →
        {{ target?.name }}
      </div>
      <div class="text-12px mb-16px">
        {{ formatDateTime(impactItem.original.assignment.validFrom, { fallback: "立即" }) }} 至
        {{ formatDateTime(impactItem.original.assignment.validUntil, { fallback: "长期" }) }}；{{
          impactItem.original.assignment.delegationGrantId ? "保留来源委派" : "直接分配"
        }}
      </div>
      <div v-for="entry in actionDiff(impactItem)" :key="entry.id" class="mb-12px">
        <strong>{{ entry.label }}</strong>
        <div>原范围：{{ entry.before }}</div>
        <div>目标范围：{{ entry.after }}</div>
      </div>
      <div v-for="entry in fieldChanges(impactItem)" :key="entry.key" class="mb-8px">
        {{ entry.resourceId }} / {{ entry.field }}：{{ entry.before }} → {{ entry.after }}
      </div>
      <div class="mt-12px">原参数：{{ impactItem.original.assignment.scopeBindings }}</div>
      <div class="mt-8px">目标参数：{{ impactItem.configuredBindings }}</div>
    </template>
  </in-dialog>
</template>
<script setup lang="ts">
import {
  Confirm,
  Message,
  createLoadGuard,
  useCapabilities,
  type Page,
  type R,
  type TableHeaderRecord,
} from "@ingot/admin-core";
import { formatDateTime } from "@ingot/shared";
import {
  roleVersionLabel,
  formatScopeKinds,
  fieldPermissionChanges,
  type AssignmentRecord,
  type AuthorizationOption,
  type ResourceDetail,
  type RoleRevision,
  type RoleApplicationApi,
  type RoleApplicationTask,
  type RoleApplicationItem,
  type RoleApplicationSelection,
  type RoleApplicationItemStatus,
} from "../models/iam";
import type { PlatformAssignmentRoleDraft } from "../models/iam/platformAssignment";
import BizIamWizardNav from "./BizIamWizardNav.vue";
import BizIamAssignmentScopeStep from "./BizIamAssignmentScopeStep.vue";
defineOptions({ name: "BizIamRoleApplicationDrawer" });
const props = defineProps<{
  api: RoleApplicationApi;
  listRevisionsApi: (id: string, page: Page) => Promise<R<Page<ResourceDetail<RoleRevision>>>>;
}>();
const emits = defineEmits<{ success: [] }>();
const visible = ref(false),
  loading = ref(false),
  saving = ref(false);
const roleId = ref(""),
  revisionId = ref(""),
  failure = ref("");
const target = ref<AuthorizationOption>();
const task = ref<RoleApplicationTask>();
const step = ref(0);
const selection = ref<RoleApplicationSelection>("ALL");
const sourceIds = ref<string[]>([]),
  assignmentIds = ref<string[]>([]),
  itemIds = ref<string[]>([]);
const revisionPage = ref<Page<ResourceDetail<RoleRevision>>>({
  current: 1,
  size: 20,
  records: [],
  total: 0,
});
const candidatePage = ref<Page<ResourceDetail<AssignmentRecord>>>({
  current: 1,
  size: 20,
  records: [],
  total: 0,
});
const itemPage = ref<Page<RoleApplicationItem>>({ current: 1, size: 20, records: [], total: 0 });
const guard = createLoadGuard();
const pageGuard = createLoadGuard();
const { contextEpoch } = useCapabilities();
const steps = [
  { title: "确定集合", description: "选择来源版本或分配" },
  { title: "配置范围", description: "保留兼容范围并补齐参数" },
  { title: "预览影响", description: "核对操作、范围和字段权限" },
  { title: "执行结果", description: "查看进度与冲突" },
];
const taskLabels = {
  PREPARING: "准备中",
  READY: "待确认",
  BLOCKED: "待处理",
  RUNNING: "执行中",
  PAUSED: "已暂停",
  SUCCEEDED: "已完成",
};
const itemLabels = {
  PENDING: "待处理",
  BLOCKED: "冲突",
  SUCCEEDED: "成功",
  EXCLUDED: "已排除",
  REVOKED: "已撤销",
  EXPIRED: "已到期",
  ALREADY_TARGET: "已为目标",
};
const itemStates = Object.keys(itemLabels) as RoleApplicationItemStatus[];
const revisionHeaders: TableHeaderRecord[] = [
  { label: "选择", prop: "select", width: 80, showOverflowTooltip: false },
  { label: "版本", prop: "version", minWidth: 180 },
  { label: "备注", prop: "remark", minWidth: 200 },
];
const candidateHeaders: TableHeaderRecord[] = [
  { label: "选择", prop: "select", width: 80, showOverflowTooltip: false },
  { label: "接收对象", prop: "subject", minWidth: 180 },
  { label: "分配版本", prop: "version", minWidth: 160 },
];
const itemHeaders: TableHeaderRecord[] = [
  { label: "选择", prop: "select", width: 80, showOverflowTooltip: false },
  { label: "接收对象 / 原版本", prop: "subject", minWidth: 220 },
  { label: "状态", prop: "status", width: 100 },
  { label: "影响与冲突", prop: "impact", minWidth: 300 },
  { label: "操作", prop: "actions", minWidth: 200 },
];
const asRevision = (row: unknown) => row as ResourceDetail<RoleRevision>;
const asAssignment = (row: unknown) => row as ResourceDetail<AssignmentRecord>;
const asItem = (row: unknown) => row as RoleApplicationItem;
const assignmentLabel = (row: AssignmentRecord) =>
  roleVersionLabel({ revision: row.revisionNumber ?? "-", versionName: row.versionName });
const subjectLabel = (row: RoleApplicationItem) =>
  `${row.original.assignment.subject.type === "GROUP" ? "用户组" : "成员"} · ${row.original.subjectName || row.original.assignment.subject.id}`;
const configurable = (row: RoleApplicationItem) =>
  ["PENDING", "BLOCKED", "EXCLUDED"].includes(row.status);
const editable = computed(
  () => !!task.value && !["RUNNING", "PAUSED", "SUCCEEDED"].includes(task.value.status),
);
const canPrepare = computed(
  () =>
    selection.value === "ALL" ||
    (selection.value === "SOURCE_REVISIONS"
      ? sourceIds.value.length > 0
      : assignmentIds.value.length > 0),
);
const privateToggle = (list: string[], id: string, checked: unknown): void => {
  const index = list.indexOf(id);
  if (checked && index < 0) list.push(id);
  else if (!checked && index >= 0) list.splice(index, 1);
};
let prepareKey = "",
  confirmKey = "";
const errorText = (error: unknown) =>
  error instanceof Error ? error.message : "操作失败，请刷新后重试";
const privateLoadItems = async (): Promise<void> => {
  if (!task.value) return;
  const token = pageGuard.begin();
  const response = await props.api.items(roleId.value, task.value.id, itemPage.value);
  if (token.isCurrent()) itemPage.value = response.data;
};
const privateLoadTask = async (): Promise<void> => {
  if (!task.value) return;
  const token = guard.begin();
  loading.value = true;
  try {
    const response = await props.api.get(roleId.value, task.value.id);
    if (!token.isCurrent()) return;
    task.value = response.data;
    await privateLoadItems();
  } catch (error) {
    if (token.isCurrent()) failure.value = errorText(error);
  } finally {
    if (token.isCurrent()) loading.value = false;
  }
};
const privateRevisionPage = async (page: number): Promise<void> => {
  revisionPage.value.current = page;
  const token = pageGuard.begin();
  try {
    const response = await props.listRevisionsApi(roleId.value, revisionPage.value);
    if (token.isCurrent()) revisionPage.value = response.data;
  } catch (error) {
    if (token.isCurrent()) failure.value = errorText(error);
  }
};
const privateRevisionSize = (size: number): void => {
  revisionPage.value.size = size;
  void privateRevisionPage(1);
};
const privateCandidatePage = async (page: number): Promise<void> => {
  candidatePage.value.current = page;
  const token = pageGuard.begin();
  try {
    const response = await props.api.candidates(roleId.value, candidatePage.value);
    if (token.isCurrent()) candidatePage.value = response.data;
  } catch (error) {
    if (token.isCurrent()) failure.value = errorText(error);
  }
};
const privateCandidateSize = (size: number): void => {
  candidatePage.value.size = size;
  void privateCandidatePage(1);
};
const privateItemsPage = (page: number): void => {
  itemPage.value.current = page;
  void privateLoadItems().catch((error) => {
    failure.value = errorText(error);
  });
};
const privateItemsSize = (size: number): void => {
  itemPage.value.size = size;
  privateItemsPage(1);
};
watch(selection, (value) => {
  prepareKey = crypto.randomUUID();
  if (value === "SOURCE_REVISIONS") void privateRevisionPage(1);
  else if (value === "ASSIGNMENTS") void privateCandidatePage(1);
});
watch(
  [sourceIds, assignmentIds],
  () => {
    prepareKey = crypto.randomUUID();
  },
  { deep: true },
);
const privateMutate = async (operation: () => Promise<R<RoleApplicationTask>>): Promise<void> => {
  if (saving.value) return;
  const token = guard.begin();
  saving.value = true;
  failure.value = "";
  try {
    const response = await operation();
    if (!token.isCurrent()) return;
    task.value = response.data;
    await privateLoadItems();
  } catch (error) {
    if (token.isCurrent()) failure.value = errorText(error);
  } finally {
    if (token.isCurrent()) saving.value = false;
  }
};
const privatePrepare = async (): Promise<void> => {
  await privateMutate(() =>
    props.api.prepare(roleId.value, {
      targetRevisionId: revisionId.value,
      selection: selection.value,
      sourceRevisionIds: [...sourceIds.value],
      assignmentIds: [...assignmentIds.value],
      idempotencyKey: prepareKey,
    }),
  );
  if (task.value) step.value = 1;
};
const privateRefresh = async (): Promise<void> => {
  if (!task.value) return;
  await privateMutate(() =>
    props.api.refresh(roleId.value, task.value!.id, { expectedVersion: task.value!.version }),
  );
};
const privateResume = async (): Promise<void> => {
  await privateRefresh();
  if (task.value && editable.value) step.value = 1;
};
const privateConfirm = async (): Promise<void> => {
  if (task.value?.status !== "READY") return;
  const token = guard.begin();
  const selectedTask = task.value;
  const selectedRole = roleId.value;
  await Confirm.warning(
    "确认将所选分配切换到目标固定版本？权限可能增加或减少，已完成批次不会自动回退。",
    { confirmButtonText: "确认执行" },
  );
  if (!token.isCurrent() || !visible.value || task.value?.id !== selectedTask.id) return;
  await privateMutate(() =>
    props.api.confirm(selectedRole, selectedTask.id, {
      expectedVersion: selectedTask.version,
      idempotencyKey: confirmKey,
    }),
  );
  if (task.value && ["RUNNING", "PAUSED", "SUCCEEDED"].includes(task.value.status)) {
    step.value = 3;
    emits("success");
  }
};
const privateExclude = async (excluded: boolean): Promise<void> => {
  if (!task.value || !itemIds.value.length) return;
  const token = guard.begin();
  const selectedTask = task.value;
  const selectedRole = roleId.value;
  const selectedItems = [...itemIds.value];
  await Confirm.warning(
    `${excluded ? "排除" : "重新纳入"}所选 ${itemIds.value.length} 条分配并重新预检？`,
  );
  if (!token.isCurrent() || !visible.value) return;
  await privateMutate(() =>
    props.api.configure(selectedRole, selectedTask.id, {
      expectedVersion: selectedTask.version,
      all: false,
      itemIds: selectedItems,
      excluded,
    }),
  );
  itemIds.value = [];
};
const scopeVisible = ref(false),
  scopeAll = ref(false);
const scopeItemIds = ref<string[]>([]);
const overwriteKeys = ref<string[]>([]);
const scopeRoles = ref<PlatformAssignmentRoleDraft[]>([]);
const scopeAssignment = ref("");
const scopeSession = ref(0);
const privateOpenScope = (row?: RoleApplicationItem, all = false): void => {
  if (!target.value || !task.value) return;
  const example =
    row ??
    itemPage.value.records?.find((r) => configurable(r) && (all || itemIds.value.includes(r.id)));
  if (!example) {
    Message.warning("请先打开包含待处理分配的页面");
    return;
  }
  scopeAll.value = all;
  scopeItemIds.value = row ? [row.id] : [...itemIds.value];
  scopeAssignment.value = example.assignmentId;
  overwriteKeys.value = row ? (target.value.parameterDefinitions || []).map((p) => p.key) : [];
  scopeRoles.value = [
    {
      option: target.value,
      bindings: JSON.parse(JSON.stringify(example.configuredBindings)),
      selectedObjects: {},
    },
  ];
  scopeSession.value++;
  scopeVisible.value = true;
};
const privateSaveScope = async (): Promise<void> => {
  if (!task.value || !overwriteKeys.value.length) return;
  const bindings = Object.fromEntries(
    overwriteKeys.value.map((key) => [key, scopeRoles.value[0]?.bindings[key]]),
  );
  if (Object.values(bindings).some((binding) => !binding?.ids.length)) {
    Message.warning("请补齐要覆盖的参数");
    return;
  }
  const token = guard.begin();
  const currentScope = scopeSession.value;
  const selectedTask = task.value;
  const selectedRole = roleId.value;
  const all = scopeAll.value;
  const selectedItems = [...scopeItemIds.value];
  if (scopeAll.value || scopeItemIds.value.length > 1)
    await Confirm.warning(
      `将明确选择的 ${overwriteKeys.value.length} 个参数覆盖到${scopeAll.value ? "全部待处理分配" : `选中 ${scopeItemIds.value.length} 条分配`}？`,
    );
  if (!token.isCurrent() || !visible.value || currentScope !== scopeSession.value) return;
  await privateMutate(() =>
    props.api.configure(selectedRole, selectedTask.id, {
      expectedVersion: selectedTask.version,
      all,
      itemIds: all ? undefined : selectedItems,
      scopeBindings: bindings,
    }),
  );
  if (!failure.value) scopeVisible.value = false;
};
const fieldChanges = (row: RoleApplicationItem) =>
  fieldPermissionChanges(row.preview?.beforeFieldPermissions, row.preview?.afterFieldPermissions);
const scopeText = (scopes: import("../models/iam").ScopeExpression[] = []): string =>
  scopes
    .map(
      (scope) =>
        `${formatScopeKinds([scope.kind])}${scope.parameterKey ? `（参数：${scope.parameterKey}）` : ""}${scope.includeDescendants ? "，包含下级" : ""}`,
    )
    .join("；") || "无";
const actionDiff = (row: RoleApplicationItem) => {
  const before = new Map((row.preview?.before || []).map((g) => [g.actionId, g]));
  const after = new Map((row.preview?.after || []).map((g) => [g.actionId, g]));
  return [...new Set([...before.keys(), ...after.keys()])]
    .filter(
      (id) => JSON.stringify(before.get(id)?.scopes) !== JSON.stringify(after.get(id)?.scopes),
    )
    .map((id) => ({
      id,
      label: `${target.value?.actions?.find((a) => a.id === id)?.name || id} · ${!before.has(id) ? "新增" : !after.has(id) ? "移除" : "范围变化"}`,
      before: before.has(id) ? scopeText(before.get(id)?.scopes) : "无",
      after: after.has(id) ? scopeText(after.get(id)?.scopes) : "无",
    }));
};
const difference = (row: RoleApplicationItem, kind: "added" | "removed" | "scope") => {
  const before = row.preview?.before || [],
    after = row.preview?.after || [];
  return kind === "added"
    ? after.filter((a) => !before.some((b) => b.actionId === a.actionId)).length
    : kind === "removed"
      ? before.filter((a) => !after.some((b) => b.actionId === a.actionId)).length
      : after.filter((a) =>
          before.some(
            (b) =>
              b.actionId === a.actionId && JSON.stringify(b.scopes) !== JSON.stringify(a.scopes),
          ),
        ).length;
};
const impactVisible = ref(false),
  impactItem = ref<RoleApplicationItem>();
const privateShowImpact = (row: RoleApplicationItem): void => {
  impactItem.value = row;
  impactVisible.value = true;
};
let poll: ReturnType<typeof setTimeout> | undefined;
const schedulePoll = (): void => {
  if (poll) clearTimeout(poll);
  if (!visible.value || task.value?.status !== "RUNNING") return;
  poll = setTimeout(async () => {
    await privateLoadTask();
    schedulePoll();
  }, 2000);
};
watch([visible, () => task.value?.status], schedulePoll);
watch(
  () => task.value?.version,
  () => {
    confirmKey = crypto.randomUUID();
  },
);
watch(visible, (value) => {
  if (!value) {
    guard.begin();
    pageGuard.begin();
    scopeVisible.value = false;
    impactVisible.value = false;
  }
});
watch(contextEpoch, () => {
  visible.value = false;
});
onBeforeUnmount(() => {
  guard.begin();
  pageGuard.begin();
  if (poll) clearTimeout(poll);
});
defineExpose({
  async show(id: string, versionId: string, existing?: RoleApplicationTask): Promise<void> {
    guard.begin();
    pageGuard.begin();
    saving.value = false;
    roleId.value = id;
    revisionId.value = versionId;
    task.value = existing;
    target.value = undefined;
    step.value = existing
      ? ["RUNNING", "PAUSED", "SUCCEEDED"].includes(existing.status)
        ? 3
        : 1
      : 0;
    itemIds.value = [];
    sourceIds.value = [];
    assignmentIds.value = [];
    failure.value = "";
    selection.value = "ALL";
    itemPage.value = { current: 1, size: 20, records: [], total: 0 };
    revisionPage.value = { current: 1, size: 20, records: [], total: 0 };
    candidatePage.value = { current: 1, size: 20, records: [], total: 0 };
    prepareKey = crypto.randomUUID();
    confirmKey = crypto.randomUUID();
    visible.value = true;
    loading.value = true;
    const token = guard.begin();
    try {
      const option = await props.api.target(id, versionId);
      if (!token.isCurrent()) return;
      target.value = option;
      if (existing) await privateLoadItems();
    } catch (error) {
      if (token.isCurrent()) failure.value = errorText(error);
    } finally {
      if (token.isCurrent()) loading.value = false;
    }
  },
});
</script>
<style scoped>
.application-content {
  padding: 24px 40px;
}
.application-content :deep(.el-alert) {
  flex-shrink: 0;
}
.application-content :deep(.el-alert--info) {
  background-color: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
}
.embedded-table :deep(.in-table) {
  padding: 0;
}
@media (max-width: 700px) {
  .application-content {
    padding: 16px 12px;
  }
  .application-items {
    min-width: 900px;
  }
}
</style>
