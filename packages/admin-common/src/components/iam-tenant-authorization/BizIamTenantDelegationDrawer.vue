<template>
  <in-drawer
    v-model="visible"
    :title="title"
    :loading="loading"
    size="100%"
    layout="pinned"
    padding="0"
    close-position="start"
    :before-close="privateBeforeClose"
  >
    <div v-if="visible" class="in-wizard-frame flex h-full min-h-0">
      <biz-iam-wizard-nav :steps="WIZARD_STEPS" :current="step" />
      <section
        class="delegation-wizard-content flex-1 min-w-0 min-h-0 flex flex-col px-48px py-24px"
      >
        <div class="mb-24px text-18px shrink-0">{{ WIZARD_STEPS[step].title }}</div>
        <div class="flex-1 min-h-0" :class="step === 2 ? 'overflow-hidden' : 'overflow-auto'">
          <in-form v-if="step === 0" label-position="top" class="max-w-720px">
            <el-alert
              type="info"
              :closable="false"
              title="委派只提供限定的角色分配能力，不授予业务权限或再次委派资格。"
            />
            <el-form-item label="授权管理员" required class="mt-24px">
              <div v-if="readonly">{{ administratorLabel }}</div>
              <biz-iam-delegation-candidate-picker
                v-else
                v-model="draft.administratorMemberId"
                :api="optionsAPI"
                :load-member-browse="loadMemberBrowse"
                :query="{ kind: 'MEMBER' }"
                :selected-options="administratorOptions"
                :reset-key="selectionKey"
                title="选择授权管理员"
                placeholder="请选择授权管理员"
                search-placeholder="搜索管理员姓名"
                @selection="privateOnAdministratorSelection"
              />
            </el-form-item>
            <el-form-item label="允许分配的角色" required>
              <div v-if="readonly">{{ roleSummary }}</div>
              <biz-iam-delegation-candidate-picker
                v-else
                v-model="draft.allowedRoleIds"
                :api="optionsAPI"
                :query="{ kind: 'ROLE' }"
                :selected-options="roleOptions"
                :reset-key="selectionKey"
                multiple
                title="选择角色"
                placeholder="请选择允许分配的角色"
                search-placeholder="搜索角色名称"
                @selection="privateOnRoleSelection"
              />
              <span class="text-12px text-[var(--el-text-color-secondary)]">
                选择当前角色。角色权限调整后，同一资源上新增的操作会跟随这次委派。
              </span>
            </el-form-item>
            <el-form-item label="允许接收的成员" required>
              <div v-if="readonly">{{ memberSummary }}</div>
              <biz-iam-delegation-candidate-picker
                v-else
                v-model="draft.recipientSelection.members"
                :api="optionsAPI"
                :load-member-browse="loadMemberBrowse"
                :query="{ kind: 'MEMBER', excludeMemberId: draft.administratorMemberId || undefined }"
                :selected-options="memberOptions"
                :reset-key="selectionKey"
                multiple
                title="选择允许接收的成员"
                placeholder="请选择允许接收的成员"
                search-placeholder="搜索成员姓名"
                @selection="privateOnMemberSelection"
              />
              <span class="text-12px text-[var(--el-text-color-secondary)]">
                只能把允许的角色分配给这些成员或下面的部门，不能分配给授权管理员本人。
              </span>
            </el-form-item>
            <el-form-item label="允许接收的部门">
              <div v-if="readonly">{{ departmentSummary }}</div>
              <template v-else>
                <biz-iam-delegation-candidate-picker
                  v-model="departmentIds"
                  :api="departmentCandidates"
                  :query="{ kind: 'OBJECT' }"
                  :selected-options="departmentOptions"
                  :reset-key="selectionKey"
                  multiple
                  title="选择允许接收的部门"
                  placeholder="请选择允许接收的部门"
                  search-placeholder="搜索部门名称"
                  @selection="privateOnDepartmentSelection"
                />
                <el-checkbox
                  v-for="department in draft.recipientSelection.departments"
                  :key="department.id"
                  v-model="department.includeDescendants"
                >
                  {{ departmentNames[department.id] || department.id }} 含下级
                </el-checkbox>
              </template>
              <span class="text-12px text-[var(--el-text-color-secondary)]">
                成员和部门至少选择一类。勾选含下级后，该部门的下级部门也在接收范围内。
              </span>
            </el-form-item>
            <el-form-item label="委派生效与失效时间（可选）">
              <div v-if="readonly">
                {{ formatDateTime(draft.validFrom, { fallback: "立即生效" }) }} 至
                {{ formatDateTime(draft.validUntil, { fallback: "长期有效" }) }}
              </div>
              <biz-iam-duration-fields
                v-else
                v-model:valid-from="draft.validFrom"
                v-model:valid-until="draft.validUntil"
              />
              <span class="text-12px text-[var(--el-text-color-secondary)]">
                留空分别表示立即生效、长期有效。
              </span>
            </el-form-item>
            <el-form-item label="单次分配最长时间" required>
              <div v-if="readonly">{{ formatDuration(draft.maxAssignmentDuration) }}</div>
              <biz-iam-duration-fields
                v-else
                v-model:max-assignment-duration="duration"
                :show-validity="false"
                show-max-duration
              />
              <span class="block w-full text-12px text-[var(--el-text-color-secondary)]">
                每次分配都必须设置失效时间，并且不能超过这段时长。委派到期或撤销后，已经发出的授权也会失效。
              </span>
            </el-form-item>
          </in-form>
          <div v-else-if="step === 1" class="max-w-720px flex flex-col gap-16px">
            <div class="text-12px text-[var(--el-text-color-secondary)]">
              以下是所选角色的当前权限，全部进入委派，不能在此移除。
            </div>
            <div v-if="roleLoadFailed" class="flex items-center gap-8px">
              <span class="text-12px text-[var(--el-color-warning)]">角色权限加载失败</span>
              <in-button link type="primary" @in-click="privateRoles">重新加载</in-button>
            </div>
            <biz-iam-delegation-operation-tree :actions="operationActions" />
          </div>
          <div v-else-if="step === 2" class="h-full min-h-0 overflow-auto flex flex-col gap-16px">
            <div class="text-12px text-[var(--el-text-color-secondary)] max-w-720px">
              按资源设置数据范围上限。同一资源下的操作共用这一上限；之后在同一资源新增的操作会跟随，新资源需要重新配置。
            </div>
            <div
              v-for="group in resourceGroups"
              :key="group.name"
              class="max-w-720px flex flex-col gap-12px"
            >
              <div>{{ group.name }}</div>
              <div
                v-for="resource in group.resources"
                :key="resource.id"
                class="rounded-4px p-16px bg-[var(--in-permission-panel-bg)] flex flex-col gap-8px"
              >
                <div>{{ resource.name }}</div>
                <div v-if="readonly">{{ ceilingLabel(resource.id) }}</div>
                <template v-else>
                  <el-select
                    class="w-320px max-w-full"
                    :model-value="ceilingOf(resource.id)?.scopes[0]?.kind"
                    placeholder="请选择资源上限"
                    @change="(kind: ScopeKind) => privateScope(resource.id, kind)"
                  >
                    <el-option
                      v-for="kind in resource.capabilities"
                      :key="kind"
                      :label="formatScopeKinds([kind])"
                      :value="kind"
                    />
                  </el-select>
                  <el-checkbox
                    v-if="descendantsToggle(resource.id)"
                    :model-value="!!ceilingOf(resource.id)?.scopes[0]?.includeDescendants"
                    @change="(value) => privateDescendants(resource.id, value === true)"
                  >
                    含下级
                  </el-checkbox>
                  <biz-iam-delegation-candidate-picker
                    v-if="needsScopeBinding(ceilingOf(resource.id)?.scopes[0]?.kind)"
                    class="w-320px max-w-full"
                    :model-value="bindingIds(resource.id)"
                    :api="scopeAPIOf(resource.id)"
                    :query="{
                      kind: 'OBJECT',
                      parameterKey: ceilingOf(resource.id)?.scopes[0]?.parameterKey,
                    }"
                    multiple
                    title="配置委派范围"
                    placeholder="请选择资源范围上限"
                    search-placeholder="搜索对象"
                    @update:model-value="(value) => privateBinding(resource.id, value)"
                  />
                </template>
              </div>
            </div>
          </div>
          <div v-else class="max-w-720px flex flex-col gap-20px">
            <div class="flex flex-col gap-8px">
              <div>授权管理员：{{ administratorLabel }}</div>
              <div>允许分配的角色：{{ roleSummary }}</div>
              <div>允许接收的成员：{{ memberSummary }}</div>
              <div>允许接收的部门：{{ departmentSummary }}</div>
              <div>
                委派有效期：{{ formatDateTime(draft.validFrom, { fallback: "立即生效" }) }} 至
                {{ formatDateTime(draft.validUntil, { fallback: "长期有效" }) }}
              </div>
              <div>单次分配最长时间：{{ formatDuration(draft.maxAssignmentDuration) }}</div>
            </div>
            <div class="text-12px text-[var(--el-text-color-secondary)]">
              {{
                readonly
                  ? "以下为当前委派配置，不会因此增加管理员的业务权限。"
                  : record
                    ? "请先预览委派影响；预览通过后才能保存。委派不会直接增加管理员的业务权限。"
                    : "核对以上配置后保存。新建委派在保存时校验，不会直接增加管理员的业务权限。"
              }}
            </div>
            <div>
              <div class="mb-8px">资源范围上限（{{ readyCeilings }} / {{ resources.length }}）</div>
              <div class="rounded-4px px-16px py-16px bg-[var(--in-permission-panel-bg)] flex flex-col gap-8px">
                <div v-for="resource in resources" :key="resource.id">
                  {{ resource.applicationName }} / {{ resource.name }}：{{ ceilingLabel(resource.id) }}
                </div>
                <div v-if="!resources.length" class="text-12px text-[var(--el-text-color-secondary)]">
                  暂无资源
                </div>
              </div>
            </div>
            <biz-iam-preview-alert v-if="record" :preview="previewState.preview.value" />
            <div
              v-if="previewState.preview.value?.effectiveResult?.affectedAssignmentIds.length"
              class="text-[var(--el-text-color-secondary)]"
            >
              受影响分配：{{
                previewState.preview.value.effectiveResult.affectedAssignmentIds.join("、")
              }}
            </div>
          </div>
        </div>
      </section>
    </div>
    <template #footer>
      <in-button @in-click="privateClose">关闭</in-button>
      <in-button v-if="record && !readonly" :loading="loading" @in-click="reloadVersion">
        刷新记录
      </in-button>
      <in-button v-if="step > 0" @in-click="step -= 1">上一步</in-button>
      <in-button v-if="step < 3" type="primary" @in-click="nextStep">下一步</in-button>
      <in-button
        v-if="step === 3 && record && !readonly"
        :loading="previewState.loading.value"
        @in-click="runPreview"
      >
        预览影响
      </in-button>
      <in-button
        v-if="step === 3 && !readonly && (!record || previewState.preview.value?.valid === true)"
        type="primary"
        :disabled="saving"
        :loading="saving"
        @in-click="privateSave"
      >
        {{ record ? "保存" : "创建委派" }}
      </in-button>
    </template>
  </in-drawer>
</template>
<script setup lang="ts">
import { formatDateTime } from "@ingot/shared";
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
  objectActionAllowed,
  Message,
  confirmUnsavedChanges,
} from "@ingot/admin-core";
import {
  IamAction,
  IAM_DEFAULT_PAGE_SIZE,
  formatScopeKinds,
  formatDuration,
  ScopeKind,
  ScopeBindingKind,
  type TenantDelegationApis,
  type TenantAssignmentApis,
  type TenantDelegationInput,
  type TenantDelegationRecord,
  type ResourceDetail,
  type ResourceScopeCeiling,
  type ReferenceImpactPreview,
  type CurrentRoleParameter,
  type CurrentRoleCatalogAction,
  type AuthorizationCandidatesApi,
  type AuthorizationCandidateKind,
  type AuthorizationActionOption,
  type IamSelectOption,
} from "../../models/iam";
import BizIamDelegationCandidatePicker from "../BizIamDelegationCandidatePicker.vue";
import BizIamDelegationOperationTree from "../BizIamDelegationOperationTree.vue";
import BizIamDurationFields from "../BizIamDurationFields.vue";
import BizIamPreviewAlert from "../BizIamPreviewAlert.vue";
import BizIamWizardNav from "../BizIamWizardNav.vue";
import { iamEditorFailure } from "../../hooks/iamEditorFailure";
import { useIamDraftPreview } from "../../hooks/useIamDraftPreview";
import { delegationPeriodError } from "../../models/iam/delegationPeriod";

defineOptions({ name: "BizIamTenantDelegationDrawer" });
const WIZARD_STEPS = [
  { title: "委派信息", description: "选择管理员、角色与接收人群" },
  { title: "确认操作", description: "核对所选角色的当前权限" },
  { title: "设置范围", description: "按资源配置数据范围上限" },
  { title: "预览影响", description: "核对配置并保存" },
] as const;
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
const visible = ref(false);
const loading = ref(false);
const saving = ref(false);
const step = ref(0);
const mode = ref<"create" | "detail" | "edit">("create");
const draft = ref(blank());
const record = ref<ResourceDetail<TenantDelegationRecord>>();
const actions = ref<CurrentRoleCatalogAction[]>([]);
const roleLoadFailed = ref(false);
const roleLoading = ref(false);
const roleNames = ref<Record<string, string>>({});
const memberNames = ref<Record<string, string>>({});
const departmentNames = ref<Record<string, string>>({});
const administratorName = ref("");
const openingKey = ref(0);
let epoch = 0;
let roleEpoch = 0;
const { unavailable, contextEpoch, hasAction } = useCapabilities();
const initial = ref("");
const selectionKey = computed(() => `${openingKey.value}:${contextEpoch.value}`);
const readonly = computed(() => {
  if (mode.value === "detail") return true;
  if (mode.value === "create") return !hasAction(IamAction.TENANT_DELEGATION_CREATE);
  return !objectActionAllowed(record.value?.capabilities, IamAction.TENANT_DELEGATION_UPDATE).allowed;
});
const title = computed(() =>
  mode.value === "create" ? "创建委派" : readonly.value ? "委派详情" : "编辑委派",
);
const fingerprint = computed(() => JSON.stringify(draft.value));
const duration = computed({
  get: () => draft.value.maxAssignmentDuration,
  set: (value: string | undefined) => {
    draft.value.maxAssignmentDuration = value || "";
  },
});
const departmentIds = computed({
  get: () => draft.value.recipientSelection.departments.map((item) => item.id),
  set: (ids: string | string[]) => {
    const values = Array.isArray(ids) ? ids : ids ? [ids] : [];
    draft.value.recipientSelection.departments = values.map(
      (id) =>
        draft.value.recipientSelection.departments.find((item) => item.id === id) || {
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
const optionsAPI: AuthorizationCandidatesApi = async (query) => {
  const response = await props.assignmentApis.optionsAPI({
    kind: query.kind as "ROLE" | "MEMBER" | "GROUP" | "RESOURCE",
    keyword: query.keyword,
    departmentId: query.departmentId,
    ids: query.ids,
    page: query.page,
    pageSize: query.pageSize,
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
const administratorOptions = computed(() =>
  draft.value.administratorMemberId
    ? [{ id: draft.value.administratorMemberId, name: administratorLabel.value }]
    : [],
);
const roleOptions = computed(() =>
  draft.value.allowedRoleIds.map((id) => ({ id, name: roleNames.value[id] || id })),
);
const memberOptions = computed(() =>
  draft.value.recipientSelection.members.map((id) => ({ id, name: memberNames.value[id] || id })),
);
const departmentOptions = computed(() =>
  draft.value.recipientSelection.departments.map((item) => ({
    id: item.id,
    name: departmentNames.value[item.id] || item.id,
  })),
);
const administratorLabel = computed(
  () => administratorName.value || record.value?.record.administratorName || draft.value.administratorMemberId || "未选择",
);
const roleSummary = computed(() => namedList(draft.value.allowedRoleIds, roleNames.value));
const memberSummary = computed(() =>
  namedList(draft.value.recipientSelection.members, memberNames.value),
);
const departmentSummary = computed(() => {
  if (!draft.value.recipientSelection.departments.length) return "未选择";
  return draft.value.recipientSelection.departments
    .map((item) => {
      const name = departmentNames.value[item.id] || item.id;
      return item.includeDescendants ? `${name}（含下级）` : name;
    })
    .join("、");
});
const operationActions = computed<AuthorizationActionOption[]>(() => [
  ...new Map(
    actions.value.map((action) => [
      action.actionId,
      {
        id: action.actionId,
        name: action.actionName,
        applicationId: action.applicationId,
        applicationName: action.applicationName,
        resourceId: action.resourceId,
        resourceName: action.resourceName,
        code: action.actionCode,
        scopeCapabilities: action.scopeCapabilities,
      },
    ]),
  ).values(),
]);
const resources = computed(() => {
  const seen = new Map<string, { id: string; name: string; applicationName: string; capabilities: ScopeKind[] }>();
  for (const action of actions.value) {
    if (!seen.has(action.resourceId)) {
      seen.set(action.resourceId, {
        id: action.resourceId,
        name: action.resourceName,
        applicationName: action.applicationName,
        capabilities: action.scopeCapabilities,
      });
    }
  }
  return [...seen.values()];
});
const resourceGroups = computed(() => {
  const groups = new Map<string, { name: string; resources: typeof resources.value }>();
  for (const resource of resources.value) {
    const group = groups.get(resource.applicationName) ?? {
      name: resource.applicationName,
      resources: [],
    };
    group.resources.push(resource);
    groups.set(resource.applicationName, group);
  }
  return [...groups.values()];
});
const readyCeilings = computed(
  () => draft.value.resourceScopeCeilings.filter((ceiling) => ceilingReady(ceiling)).length,
);
const previewState = useIamDraftPreview<TenantDelegationInput, ReferenceImpactPreview>({
  contextEpoch: () => `${contextEpoch.value}:${record.value?.version || "0"}`,
  preview: async (input) => {
    if (!record.value) throw new Error("missing delegation");
    return (
      await props.apis.previewAPI(record.value.record.id, {
        expectedVersion: record.value.version,
        delegation: input,
      })
    ).data;
  },
});
const namedList = (ids: string[], names: Record<string, string>): string =>
  ids.length ? ids.map((id) => names[id] || id).join("、") : "未选择";
const ceilingOf = (resourceId: string): ResourceScopeCeiling | undefined =>
  draft.value.resourceScopeCeilings.find((ceiling) => ceiling.resourceId === resourceId);
const RESOURCE_PARAMETER_PREFIX = "resource-";
const needsScopeBinding = (kind?: ScopeKind): boolean =>
  kind === ScopeKind.OBJECT_SET || kind === ScopeKind.MANAGED_DEPARTMENTS;
const scopeBindingKind = (kind: ScopeKind): ScopeBindingKind =>
  kind === ScopeKind.MANAGED_DEPARTMENTS ? ScopeBindingKind.DEPARTMENTS : ScopeBindingKind.OBJECTS;
const resourceParameterKey = (resourceId: string, kind: ScopeBindingKind): string =>
  `${RESOURCE_PARAMETER_PREFIX}${resourceId}-${kind.toLowerCase()}`;
const scopeParameter = (resourceId: string, kind: ScopeKind): CurrentRoleParameter | undefined => {
  if (!needsScopeBinding(kind)) return undefined;
  const bindingKind = scopeBindingKind(kind);
  const stable = resourceParameterKey(resourceId, bindingKind);
  const matches = actions.value
    .filter((action) => action.resourceId === resourceId)
    .flatMap((action) => action.parameterDefinitions)
    .filter((item) => item.resourceId === resourceId && item.kind === bindingKind);
  return (
    matches.find((item) => item.key === stable) ??
    matches[0] ?? { key: stable, kind: bindingKind, resourceId }
  );
};
const ceilingReady = (ceiling: ResourceScopeCeiling): boolean => {
  const scope = ceiling.scopes[0];
  if (!scope) return false;
  if (scope.kind !== ScopeKind.OBJECT_SET && scope.kind !== ScopeKind.MANAGED_DEPARTMENTS) return true;
  const key = scope.parameterKey;
  return !!key && (ceiling.scopeBindings[key]?.ids.length ?? 0) > 0;
};
const ceilingLabel = (resourceId: string): string => {
  const ceiling = ceilingOf(resourceId);
  if (!ceiling?.scopes.length) return "待配置";
  const text = formatScopeKinds(ceiling.scopes.map((scope) => scope.kind));
  return ceiling.scopes[0]?.includeDescendants ? `${text}（含下级）` : text;
};
const descendantsToggle = (resourceId: string): boolean => {
  const kind = ceilingOf(resourceId)?.scopes[0]?.kind;
  return kind === ScopeKind.MANAGED_DEPARTMENTS || kind === ScopeKind.MEMBER_DEPARTMENTS;
};
const bindingIds = (resourceId: string): string[] => {
  const scope = ceilingOf(resourceId)?.scopes[0];
  if (!scope?.parameterKey) return [];
  return ceilingOf(resourceId)?.scopeBindings[scope.parameterKey]?.ids || [];
};
const scopeAPIOf =
  (resourceId: string): AuthorizationCandidatesApi =>
  (query) =>
    props.apis.scopeAPI({
      resourceId,
      parameterKey: query.parameterKey || "",
      keyword: query.keyword,
      ids: query.ids,
      page: query.page,
      pageSize: query.pageSize,
    });
const privateOnAdministratorSelection = (items: IamSelectOption[]): void => {
  administratorName.value = items[0]?.name || "";
};
const privateOnRoleSelection = (items: IamSelectOption[]): void => {
  const next = { ...roleNames.value };
  items.forEach((item) => {
    next[item.id] = item.name;
  });
  roleNames.value = next;
};
const privateOnMemberSelection = (items: IamSelectOption[]): void => {
  memberNames.value = Object.fromEntries(items.map((item) => [item.id, item.name]));
};
const privateOnDepartmentSelection = (items: IamSelectOption[]): void => {
  const next = { ...departmentNames.value };
  items.forEach((item) => {
    next[item.id] = item.name;
  });
  departmentNames.value = next;
};
const privateRoles = async (): Promise<void> => {
  const current = epoch;
  const currentRole = ++roleEpoch;
  const ids = [...draft.value.allowedRoleIds];
  roleLoading.value = true;
  if (!ids.length) {
    actions.value = [];
    draft.value.resourceScopeCeilings = [];
    roleLoadFailed.value = false;
    roleLoading.value = false;
    return;
  }
  try {
    const roles = await Promise.all(ids.map((id) => props.assignmentApis.roleAPI(id)));
    if (current !== epoch || currentRole !== roleEpoch) return;
    const loaded = roles.flatMap((role) => role.data.items);
    actions.value = loaded;
    const seen = new Set<string>();
    draft.value.resourceScopeCeilings = loaded.flatMap((action) => {
      if (seen.has(action.resourceId)) return [];
      seen.add(action.resourceId);
      const existing = draft.value.resourceScopeCeilings.find(
        (ceiling) => ceiling.resourceId === action.resourceId,
      );
      if (existing) return [existing];
      const supportsAll = action.scopeCapabilities.includes(ScopeKind.ALL);
      return [
        {
          resourceId: action.resourceId,
          scopes: supportsAll ? [{ kind: ScopeKind.ALL }] : [],
          scopeBindings: {},
        },
      ];
    });
    draft.value.resourceScopeCeilings.forEach(attachScopeParameter);
    roleLoadFailed.value = false;
  } catch (error) {
    if (current !== epoch || currentRole !== roleEpoch) return;
    roleLoadFailed.value = true;
    iamEditorFailure(error);
  } finally {
    if (current === epoch && currentRole === roleEpoch) roleLoading.value = false;
  }
};
const attachScopeParameter = (ceiling: ResourceScopeCeiling): void => {
  const scope = ceiling.scopes[0];
  if (!scope || !needsScopeBinding(scope.kind) || scope.parameterKey) return;
  const parameter = scopeParameter(ceiling.resourceId, scope.kind);
  if (!parameter) return;
  scope.parameterKey = parameter.key;
  ceiling.scopeBindings[parameter.key] ??= { kind: parameter.kind, ids: [] };
};
const privateScope = (resourceId: string, kind: ScopeKind): void => {
  const ceiling = ceilingOf(resourceId);
  if (!ceiling) return;
  const parameter = scopeParameter(resourceId, kind);
  ceiling.scopes = [{ kind, ...(parameter ? { parameterKey: parameter.key } : {}) }];
  ceiling.scopeBindings = parameter
    ? { [parameter.key]: { kind: parameter.kind, ids: [] } }
    : {};
};
const privateDescendants = (resourceId: string, value: boolean): void => {
  const scope = ceilingOf(resourceId)?.scopes[0];
  if (scope) scope.includeDescendants = value;
};
const privateBinding = (resourceId: string, value: string | string[]): void => {
  const ceiling = ceilingOf(resourceId);
  const key = ceiling?.scopes[0]?.parameterKey;
  if (!ceiling || !key) return;
  ceiling.scopeBindings[key] = {
    kind:
      ceiling.scopes[0].kind === ScopeKind.MANAGED_DEPARTMENTS
        ? ScopeBindingKind.DEPARTMENTS
        : ScopeBindingKind.OBJECTS,
    ids: Array.isArray(value) ? value : value ? [value] : [],
  };
};
const loadNames = async (
  ids: string[],
  load: AuthorizationCandidatesApi,
  kind: AuthorizationCandidateKind,
): Promise<Record<string, string>> => {
  const current = epoch;
  const names: Record<string, string> = {};
  if (!ids.length) return names;
  let page = 1;
  let total = ids.length;
  while (Object.keys(names).length < ids.length && (page - 1) * IAM_DEFAULT_PAGE_SIZE < total) {
    const response = await load({ kind, ids, page, pageSize: IAM_DEFAULT_PAGE_SIZE });
    if (current !== epoch) return names;
    total = Number(response.data.total || ids.length);
    response.data.items.forEach((item) => {
      names[item.id] = item.name;
    });
    if (!response.data.items.length) break;
    page += 1;
  }
  return names;
};
const hydrateNames = async (): Promise<void> => {
  const current = epoch;
  const [roles, members, departments] = await Promise.all([
    loadNames(draft.value.allowedRoleIds, optionsAPI, "ROLE"),
    loadNames(draft.value.recipientSelection.members, optionsAPI, "MEMBER"),
    loadNames(
      draft.value.recipientSelection.departments.map((item) => item.id),
      props.departmentCandidates,
      "OBJECT",
    ),
  ]);
  if (current !== epoch) return;
  roleNames.value = roles;
  memberNames.value = members;
  departmentNames.value = departments;
  administratorName.value = record.value?.record.administratorName || administratorName.value;
};
watch(
  () => draft.value.allowedRoleIds.join(","),
  () => {
    if (loading.value) return;
    void privateRoles();
  },
);
watch(
  () => draft.value.administratorMemberId,
  (id, previous) => {
    if (loading.value || !id || id === previous) return;
    if (!draft.value.recipientSelection.members.includes(id)) return;
    draft.value.recipientSelection.members = draft.value.recipientSelection.members.filter(
      (memberId) => memberId !== id,
    );
    const next = { ...memberNames.value };
    delete next[id];
    memberNames.value = next;
    Message.success("已从允许接收的成员中移除授权管理员本人");
  },
);
watch(
  draft,
  () => {
    if (!loading.value) previewState.bumpDraft();
  },
  { deep: true },
);
watch(contextEpoch, () => {
  epoch += 1;
  visible.value = false;
});
const nextStep = (): void => {
  if (readonly.value) {
    step.value = Math.min(step.value + 1, WIZARD_STEPS.length - 1);
    return;
  }
  if (step.value === 0) {
    if (
      !draft.value.administratorMemberId ||
      !draft.value.allowedRoleIds.length ||
      (!draft.value.recipientSelection.members.length &&
        !draft.value.recipientSelection.departments.length)
    ) {
      Message.warning("请选择授权管理员、允许分配的角色，以及接收成员或部门");
      return;
    }
    const issue = delegationPeriodError(
      draft.value.validFrom,
      draft.value.validUntil,
      draft.value.maxAssignmentDuration,
      "LIMITED",
    );
    if (issue) {
      Message.warning(issue);
      return;
    }
  }
  if (step.value === 1 && roleLoading.value) {
    Message.warning("正在加载角色权限");
    return;
  }
  if (step.value === 1 && (roleLoadFailed.value || !actions.value.length)) {
    Message.warning(roleLoadFailed.value ? "请重新加载角色权限" : "所选角色没有可委派的操作");
    return;
  }
  if (step.value === 2 && readyCeilings.value !== resources.value.length) {
    Message.warning("请为每个资源设置范围上限");
    return;
  }
  step.value += 1;
};
const privateBeforeClose = (done: () => void): void => {
  if (loading.value) return;
  if (initial.value === fingerprint.value) done();
  else
    void confirmUnsavedChanges().then((allowed) => {
      if (allowed) done();
    });
};
const privateClose = (): void => {
  privateBeforeClose(() => {
    visible.value = false;
  });
};
const reloadVersion = async (): Promise<void> => {
  if (!record.value || loading.value) return;
  loading.value = true;
  const current = epoch;
  try {
    const response = await props.apis.detailAPI(record.value.record.id);
    if (current !== epoch || !record.value) return;
    record.value = { ...record.value, version: response.data.version, capabilities: response.data.capabilities };
    previewState.bumpDraft();
    Message.success("已刷新记录，草稿已保留，请重新预览");
  } catch (error) {
    iamEditorFailure(error);
  } finally {
    if (current === epoch) loading.value = false;
  }
};
const runPreview = async (): Promise<void> => {
  const issue = delegationPeriodError(
    draft.value.validFrom,
    draft.value.validUntil,
    draft.value.maxAssignmentDuration,
    "LIMITED",
  );
  if (issue) {
    Message.warning(issue);
    return;
  }
  try {
    await previewState.runPreview(draft.value);
  } catch (error) {
    iamEditorFailure(error);
  }
};
const privateSave = async (): Promise<void> => {
  if (readonly.value || saving.value || unavailable.value) return;
  if (record.value && previewState.preview.value?.valid !== true) return;
  if (
    !hasAction(record.value ? IamAction.TENANT_DELEGATION_UPDATE : IamAction.TENANT_DELEGATION_CREATE)
  )
    return;
  const issue = delegationPeriodError(
    draft.value.validFrom,
    draft.value.validUntil,
    draft.value.maxAssignmentDuration,
    "LIMITED",
  );
  if (issue) {
    Message.warning(issue);
    return;
  }
  const current = epoch;
  saving.value = true;
  try {
    if (record.value) {
      await props.apis.updateAPI(record.value.record.id, {
        expectedVersion: record.value.version,
        delegation: draft.value,
      });
    } else {
      await props.apis.createAPI(draft.value);
    }
    await refreshSessionPermissions({ refreshMenusIfVersionChanged: true }).catch(() =>
      Message.warning("已保存，权限刷新暂不可用，请稍后重试"),
    );
    if (current !== epoch) return;
    Message.success("已保存委派");
    initial.value = fingerprint.value;
    visible.value = false;
    emits("success");
  } catch (error) {
    previewState.bumpDraft();
    iamEditorFailure(error);
  } finally {
    if (current === epoch) saving.value = false;
  }
};
const show = async (
  row?: ResourceDetail<TenantDelegationRecord>,
  openMode: "detail" | "edit" = "edit",
): Promise<void> => {
  const current = ++epoch;
  openingKey.value += 1;
  step.value = 0;
  mode.value = row ? openMode : "create";
  visible.value = true;
  loading.value = true;
  record.value = undefined;
  draft.value = blank();
  actions.value = [];
  roleNames.value = {};
  memberNames.value = {};
  departmentNames.value = {};
  administratorName.value = "";
  roleLoadFailed.value = false;
  previewState.bumpDraft();
  try {
    if (row) {
      const response = await props.apis.detailAPI(row.record.id);
      if (current !== epoch) return;
      record.value = response.data;
      draft.value = structuredClone(toRaw(response.data.record.delegation));
      draft.value.assignmentDurationMode = "LIMITED";
      await hydrateNames();
      if (current !== epoch) return;
    }
    await privateRoles();
    if (current !== epoch) return;
    initial.value = fingerprint.value;
  } catch (error) {
    iamEditorFailure(error);
  } finally {
    if (current === epoch) loading.value = false;
  }
};
defineExpose({ show });
</script>
<style lang="postcss" scoped>
@media (max-width: 700px) {
  .delegation-wizard-content {
    padding: 16px;
  }
}
</style>
