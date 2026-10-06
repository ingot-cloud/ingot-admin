<template>
  <in-dialog
    v-model="visible"
    title="配置成员角色"
    width="960px"
    layout="pinned"
    class="member-role-assign-dialog h-85vh !max-h-85vh"
    append-to-body
  >
    <div class="h-full flex flex-1 min-h-0 min-w-0 gap-24px">
      <biz-iam-wizard-nav class="!h-auto self-stretch" :steps="steps" :current="step" />
      <in-loading :loading="loading" class="min-w-0 flex-1 overflow-y-auto pr-8px py-16px">
        <div v-if="step === 0" class="flex flex-col gap-16px">
          <div class="text-12px text-[var(--el-text-color-secondary)]">
            明确选择固定版本，再配置对象范围。确认后仅更新草稿，保存成员时一起生效。
          </div>
          <in-form label-position="top">
            <el-form-item v-if="canAdd" :label="memberId ? '添加角色' : '角色'">
              <biz-iam-delegation-role-picker
                v-model="newOptions"
                :tree-api="PlatformAssignmentRoleCandidatesAPI"
                :detail-api="PlatformAssignmentCandidatesAPI"
                :reset-key="epoch"
                one-version-per-role
                allow-empty
                title="选择角色"
                placeholder="请选择角色及固定版本"
              />
            </el-form-item>
            <template v-if="newOptions.length">
              <el-form-item label="新增角色有效期（可选）">
                <biz-iam-duration-fields
                  v-model:valid-from="state.validFrom"
                  v-model:valid-until="state.validUntil"
                />
              </el-form-item>
              <div class="text-12px text-[var(--el-text-color-secondary)]">
                留空表示立即生效、长期有效；已绑定角色的原有效期保持不变。
              </div>
            </template>
          </in-form>
          <template v-if="memberId">
            <div>已绑定的直接角色</div>
            <div class="text-12px text-[var(--el-text-color-secondary)]">
              用户组继承和委派来源不在此处修改。仅修改已加载记录，其他记录保留。
            </div>
            <div
              v-for="item in currentRecords"
              :key="item.record.id"
              class="flex items-center gap-8px p-12px bg-[var(--in-permission-panel-bg)] rounded-4px"
            >
              <span class="flex-1"
                >{{ item.record.roleName }} · v{{ item.record.revisionNumber }}</span
              >
              <in-button
                v-if="canRemove && recordAllowed(item, IamAction.PLATFORM_ASSIGNMENT_DELETE)"
                link
                type="danger"
                @in-click="privateRemove(item.record.id)"
                >移除</in-button
              >
            </div>
            <div v-if="!currentRecords.length" class="text-[var(--el-text-color-secondary)]">
              本页暂无可编辑的直接角色
            </div>
            <el-pagination
              v-if="total > IAM_DEFAULT_PAGE_SIZE"
              :current-page="page"
              :page-size="IAM_DEFAULT_PAGE_SIZE"
              :total="total"
              layout="prev, pager, next"
              size="small"
              @current-change="privatePage"
            />
            <div v-if="state.removed.length" class="text-12px">
              待移除 {{ state.removed.length }} 条
              <in-button link @in-click="privateRestore">恢复移除</in-button>
            </div>
          </template>
        </div>
        <biz-iam-assignment-scope-step
          v-else
          ref="scopeStep"
          v-model:roles="activeRoles"
          :api="PlatformAssignmentCandidatesAPI"
          :selected-api-for-role="selectedApiForRole"
          :readonly-for-role="readonlyForRole"
          :reset-key="epoch"
        />
        <el-alert
          v-if="failed"
          class="mt-16px"
          type="error"
          title="角色资料加载失败，草稿已保留，请重试"
          :closable="false"
        />
      </in-loading>
    </div>
    <template #footer>
      <in-button :disabled="loading" @in-click="visible = false">取消</in-button>
      <in-button v-if="step === 1" :disabled="loading" @in-click="step = 0">上一步</in-button>
      <in-button v-if="step === 0" type="primary" :loading="loading" @in-click="privateNext"
        >下一步</in-button
      >
      <in-button v-else type="primary" :disabled="loading" @in-click="privateConfirm"
        >确认配置</in-button
      >
    </template>
  </in-dialog>
</template>
<script setup lang="ts">
import { Message, objectActionAllowed } from "@ingot/admin-core";
import {
  BizIamAssignmentScopeStep,
  BizIamDelegationRolePicker,
  BizIamDurationFields,
  BizIamWizardNav,
  IAM_DEFAULT_PAGE_SIZE,
  AssignmentEffectiveStatus,
  IamAction,
  assignmentScopeIssues,
  assignmentValidityIssue,
  reconcileAssignmentRoles,
  type AuthorizationOption,
  type AuthorizationCandidatesApi,
  type AssignmentRecord,
  type ResourceDetail,
  type PlatformAssignmentRoleDraft,
} from "@ingot/admin-common";
import { PlatformMemberAssignmentsAPI } from "@/api/iam/personnel";
import {
  PlatformAssignmentCandidatesAPI,
  PlatformAssignmentRoleCandidatesAPI,
  PlatformAssignmentSelectedCandidatesAPI,
} from "@/api/iam/authorization";
import {
  emptyMemberRoleState,
  cloneMemberRoleState,
  memberAssignmentKey,
  type MemberRoleEditorState,
} from "../memberRoleEditor";

defineOptions({ name: "MemberRoleAssignDialog" });
const props = withDefaults(
  defineProps<{ memberId?: string; canAdd?: boolean; canUpdate?: boolean; canRemove?: boolean }>(),
  { canAdd: true },
);
const emits = defineEmits<{ confirm: [draft: MemberRoleEditorState] }>();
const visible = ref(false);
const loading = ref(false);
const failed = ref(false);
const step = ref(0);
const epoch = ref(0);
const page = ref(1);
const total = ref(0);
const pages = ref<Record<number, string[]>>({});
const state = ref<MemberRoleEditorState>(emptyMemberRoleState());
const newOptions = ref<AuthorizationOption[]>([]);
const scopeStep = ref<InstanceType<typeof BizIamAssignmentScopeStep>>();
const steps = [
  { title: "选择角色", description: "选择固定版本及新增有效期" },
  { title: "设置范围", description: "配置具体对象并确认草稿" },
];
const currentRecords = computed(() =>
  state.value.stored.filter(
    (item) =>
      pages.value[page.value]?.includes(item.record.id) &&
      !state.value.removed.includes(item.record.id),
  ),
);
const activeRoles = computed({
  get: () =>
    state.value.roles.filter(
      (role) =>
        !state.value.removed.some((id) => memberAssignmentKey(id) === role.configurationKey),
    ),
  set: (roles: PlatformAssignmentRoleDraft[]) => {
    state.value.roles = [
      ...state.value.roles.filter((role) =>
        state.value.removed.some((id) => memberAssignmentKey(id) === role.configurationKey),
      ),
      ...roles,
    ];
  },
});
const recordAllowed = (row: ResourceDetail<AssignmentRecord>, action: string): boolean =>
  objectActionAllowed(row.capabilities, action).allowed;
const readonlyForRole = (role: PlatformAssignmentRoleDraft): boolean => {
  const record = state.value.stored.find(
    (item) => memberAssignmentKey(item.record.id) === role.configurationKey,
  );
  return (
    !!record && (!props.canUpdate || !recordAllowed(record, IamAction.PLATFORM_ASSIGNMENT_UPDATE))
  );
};
const selectedApiForRole = (
  role: PlatformAssignmentRoleDraft,
): AuthorizationCandidatesApi | undefined => {
  const row = state.value.stored.find(
    (item) => memberAssignmentKey(item.record.id) === role.configurationKey,
  );
  return row ? (query) => PlatformAssignmentSelectedCandidatesAPI(row.record.id, query) : undefined;
};
const privatePage = async (next: number): Promise<void> => {
  page.value = next;
  if (!props.memberId || pages.value[next]) return;
  const current = epoch.value;
  loading.value = true;
  failed.value = false;
  try {
    const response = await PlatformMemberAssignmentsAPI(
      props.memberId,
      { current: next, size: IAM_DEFAULT_PAGE_SIZE },
      undefined,
      { effectiveStatus: AssignmentEffectiveStatus.ACTIVE, directOnly: true },
    );
    if (current !== epoch.value || !visible.value) return;
    total.value = response.data.total || 0;
    const records = response.data.records || [];
    pages.value[next] = records.map((item) => item.record.id);
    const loadedIds = new Set(state.value.stored.map((item) => item.record.id));
    state.value.stored.push(...records.filter((item) => !loadedIds.has(item.record.id)));
  } catch {
    if (current === epoch.value) failed.value = true;
  } finally {
    if (current === epoch.value) loading.value = false;
  }
};
const privateRemove = (id: string): void => {
  state.value.removed = [...state.value.removed, id];
};
const privateRestore = (): void => {
  state.value.removed = [];
};
watch(newOptions, (options) => {
  state.value.roles = [
    ...state.value.roles.filter((role) => role.configurationKey),
    ...reconcileAssignmentRoles(
      state.value.roles.filter((role) => !role.configurationKey),
      options,
    ),
  ];
});
const privateNext = async (): Promise<void> => {
  if (loading.value) return;
  if (failed.value && props.memberId && !pages.value[page.value]) {
    await privatePage(page.value);
    if (failed.value) return;
  }
  const validity = assignmentValidityIssue(state.value.validFrom, state.value.validUntil);
  if (newOptions.value.length && validity) {
    Message.warning(validity);
    return;
  }
  const current = epoch.value;
  loading.value = true;
  try {
    // 逐记录读取真实绑定的固定版本；不同记录的同名参数始终独立。
    const missing = state.value.stored.filter(
      (row) =>
        !state.value.removed.includes(row.record.id) &&
        !state.value.roles.some(
          (role) => role.configurationKey === memberAssignmentKey(row.record.id),
        ),
    );
    const loaded = await Promise.all(
      missing.map(async (row) => {
        const response = await PlatformAssignmentSelectedCandidatesAPI(row.record.id, {
          kind: "ROLE_REVISION",
          page: 1,
          pageSize: IAM_DEFAULT_PAGE_SIZE,
        });
        const option = response.data.items.find(
          (item) => item.id === row.record.assignment.roleRevisionRef.id,
        );
        if (!option) throw new Error("固定版本不可用");
        return {
          option,
          configurationKey: memberAssignmentKey(row.record.id),
          bindings: cloneMemberRoleState({
            ...emptyMemberRoleState(),
            roles: [{ option, bindings: row.record.assignment.scopeBindings, selectedObjects: {} }],
          }).roles[0].bindings,
          selectedObjects: {},
        };
      }),
    );
    if (current !== epoch.value) return;
    state.value.roles.push(...loaded);
    failed.value = false;
    step.value = 1;
  } catch {
    if (current === epoch.value) failed.value = true;
  } finally {
    if (current === epoch.value) loading.value = false;
  }
};
const privateConfirm = (): void => {
  const issues = assignmentScopeIssues(activeRoles.value);
  if (issues.length) {
    Message.warning(issues[0]);
    void scopeStep.value?.showOutstanding();
    return;
  }
  const ids = newOptions.value.map((option) => option.roleNode?.roleId);
  if (ids.some((id) => !id) || new Set(ids).size !== ids.length) {
    Message.warning("每个新增角色请选择一个固定版本");
    return;
  }
  emits("confirm", cloneMemberRoleState(state.value));
  visible.value = false;
};
watch(visible, (value) => {
  if (!value) epoch.value += 1;
});
defineExpose({
  show(draft?: MemberRoleEditorState) {
    epoch.value += 1;
    state.value = cloneMemberRoleState(draft || emptyMemberRoleState());
    newOptions.value = state.value.roles
      .filter((role) => !role.configurationKey)
      .map((role) => role.option);
    pages.value = {};
    step.value = 0;
    page.value = 1;
    total.value = 0;
    failed.value = false;
    loading.value = false;
    visible.value = true;
    void privatePage(1);
  },
});
</script>

<style lang="postcss" scoped>
.member-role-assign-dialog :deep(.el-dialog__body) {
  display: flex;
  overflow: hidden;
  padding-block: 0;
}
</style>
