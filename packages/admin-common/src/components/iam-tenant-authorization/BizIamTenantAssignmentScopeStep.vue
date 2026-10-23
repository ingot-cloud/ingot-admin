<template>
  <div class="flex flex-col gap-16px">
    <div class="flex flex-wrap items-center gap-12px">
      <span>已配置 {{ configuredCount }} / {{ items.length }} 项</span>
      <el-checkbox v-model="outstandingOnly" :disabled="!items.length">仅看待配置</el-checkbox>
    </div>
    <el-alert
      v-for="issue in loadIssues"
      :key="issue"
      type="warning"
      :closable="false"
      :title="issue"
    />
    <div v-if="!items.length && !loadIssues.length" class="text-[var(--el-text-color-secondary)]">
      所选角色无需填写对象范围，可直接下一步。
    </div>
    <div
      v-for="item in visibleItems"
      :key="item.key"
      class="rounded-4px p-16px bg-[var(--in-permission-panel-bg)] flex flex-col gap-12px"
      :data-scope-item="item.key"
    >
      <div class="flex flex-wrap items-center gap-8px">
        <span class="flex-1 min-w-0">{{ roleName(item.roleId) }}</span>
        <el-tag :type="item.configured ? 'success' : 'warning'" size="small">
          {{ item.configured ? "已配置" : "待配置" }}
        </el-tag>
      </div>
      <div>{{ applicationName(item) }}</div>
      <div class="h-1px bg-[var(--in-border-color)]" />
      <div class="pl-8px flex flex-col gap-8px">
        <div>{{ item.resourceName }}</div>
        <div
          v-if="actionNames(item).length"
          class="pl-24px text-12px text-[var(--el-text-color-secondary)]"
        >
          关联操作：{{ actionNames(item).join("、") }}
        </div>
        <div class="pl-24px flex flex-col gap-8px">
          <span>范围：{{ tenantScopeKindLabel(item.parameter.kind) }}</span>
          <biz-iam-delegation-candidate-picker
            :model-value="bindingIds(item)"
            :api="apiFor(item.roleId)"
            :query="{ kind: 'OBJECT', parameterKey: item.parameter.key }"
            :selected-options="selectedObjects(item)"
            :reset-key="`${resetKey}:${item.key}`"
            :disabled="disabled"
            multiple
            :title="`选择${tenantScopeKindLabel(item.parameter.kind)}`"
            :placeholder="`请选择${item.resourceName}的${tenantScopeKindLabel(item.parameter.kind)}`"
            search-placeholder="搜索范围对象"
            @confirm="privateObjects(item, $event)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import type { AuthorizationCandidatesApi, IamSelectOption } from "../../models/iam";
import {
  tenantAssignmentScopeIssues,
  tenantAssignmentScopeItems,
  tenantScopeKindLabel,
  type TenantAssignmentRoleDraft,
  type TenantAssignmentScopeItem,
} from "../../models/iam/tenantAssignment";
import BizIamDelegationCandidatePicker from "../BizIamDelegationCandidatePicker.vue";

defineOptions({ name: "BizIamTenantAssignmentScopeStep" });
defineProps<{
  /** 按角色生成范围候选查询，候选受该角色定义与授权依据约束。 */
  apiFor: (roleId: string) => AuthorizationCandidatesApi;
  resetKey: string | number;
  disabled?: boolean;
}>();
const roles = defineModel<TenantAssignmentRoleDraft[]>("roles", { required: true });
const outstandingOnly = ref(false);
const items = computed(() => tenantAssignmentScopeItems(roles.value));
const configuredCount = computed(() => items.value.filter((item) => item.configured).length);
const visibleItems = computed(() =>
  outstandingOnly.value ? items.value.filter((item) => !item.configured) : items.value,
);
const loadIssues = computed(() =>
  tenantAssignmentScopeIssues(roles.value).filter((issue) => issue.endsWith("请重新加载")),
);
const draftOf = (roleId: string) => roles.value.find((draft) => draft.role.id === roleId);
const roleName = (roleId: string): string => draftOf(roleId)?.role.name || roleId;
const actionsOf = (item: TenantAssignmentScopeItem) => {
  const definition = draftOf(item.roleId)?.definition;
  if (!definition) return [];
  const actionIds = new Set(
    definition.definition.grants
      .filter((grant) => grant.scopes.some((scope) => scope.parameterKey === item.parameter.key))
      .map((grant) => grant.actionId),
  );
  return definition.items.filter((action) => actionIds.has(action.actionId));
};
const actionNames = (item: TenantAssignmentScopeItem): string[] =>
  actionsOf(item).map((action) => action.actionName);
const applicationName = (item: TenantAssignmentScopeItem): string =>
  actionsOf(item)[0]?.applicationName ||
  draftOf(item.roleId)?.definition?.items.find(
    (action) => action.resourceId === item.parameter.resourceId,
  )?.applicationName ||
  "";
const bindingIds = (item: TenantAssignmentScopeItem): string[] =>
  draftOf(item.roleId)?.bindings[item.parameter.key]?.ids || [];
const selectedObjects = (item: TenantAssignmentScopeItem): IamSelectOption[] =>
  draftOf(item.roleId)?.selectedObjects[item.parameter.key] || [];
const privateObjects = (item: TenantAssignmentScopeItem, options: IamSelectOption[]): void => {
  roles.value = roles.value.map((draft) =>
    draft.role.id === item.roleId
      ? {
          ...draft,
          bindings: {
            ...draft.bindings,
            [item.parameter.key]: {
              kind: item.parameter.kind,
              ids: options.map((option) => option.id),
            },
          },
          selectedObjects: { ...draft.selectedObjects, [item.parameter.key]: options },
        }
      : draft,
  );
};
defineExpose({
  /** 切到待配置视图并滚动到第一项。 */
  async showOutstanding() {
    if (!items.value.some((item) => !item.configured)) return;
    outstandingOnly.value = true;
    await nextTick();
    const first = items.value.find((item) => !item.configured);
    if (!first) return;
    Array.from(document.querySelectorAll<HTMLElement>("[data-scope-item]"))
      .find((element) => element.dataset.scopeItem === first.key)
      ?.scrollIntoView?.({ block: "center" });
  },
});
</script>
