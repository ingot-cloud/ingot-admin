<template>
  <div class="rounded-4px px-16px py-16px bg-[var(--in-permission-panel-bg)] flex flex-col gap-16px">
    <div v-if="!groups.length" class="text-12px text-[var(--el-text-color-secondary)]">
      暂无操作
    </div>
    <div v-for="app in groups" :key="app.id" class="flex flex-col gap-12px">
      <div>{{ app.name }}</div>
      <div class="h-1px bg-[var(--in-border-color)]" />
      <div v-for="resource in app.resources" :key="resource.id" class="flex flex-col gap-8px">
        <div class="flex items-center gap-8px">
          <in-icon name="ep:check" class="text-[var(--in-color-primary)]" />
          <span>{{ resource.name }}</span>
        </div>
        <div
          v-for="action in resource.actions"
          :key="action.id"
          class="pl-24px flex flex-col gap-4px"
        >
          <div class="flex items-center gap-8px">
            <in-icon name="ep:check" class="text-[var(--in-color-primary)]" />
            <span>{{ action.name }}</span>
          </div>
          <div v-if="showCeilings" class="pl-24px text-12px text-[var(--el-text-color-secondary)]">
            {{ privateCeilingLabel(action.id) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ScopeKind,
  useScopeKindEnum,
  type ActionScopeCeiling,
  type AuthorizationActionOption,
} from "../models/iam";

defineOptions({ name: "BizIamDelegationOperationTree" });
const props = withDefaults(
  defineProps<{
    actions: AuthorizationActionOption[];
    ceilings?: Record<string, ActionScopeCeiling>;
    showCeilings?: boolean;
  }>(),
  { ceilings: () => ({}) },
);
type ResourceGroup = { id: string; name: string; actions: AuthorizationActionOption[] };
type ApplicationGroup = { id: string; name: string; resources: ResourceGroup[] };
const groups = computed<ApplicationGroup[]>(() => {
  const applications = new Map<string, ApplicationGroup>();
  for (const action of props.actions) {
    const appId = action.applicationId || action.applicationName;
    let app = applications.get(appId);
    if (!app) {
      app = { id: appId, name: action.applicationName, resources: [] };
      applications.set(appId, app);
    }
    const resourceId = action.resourceId || action.resourceName;
    let resource = app.resources.find((item) => item.id === resourceId);
    if (!resource) {
      resource = { id: resourceId, name: action.resourceName, actions: [] };
      app.resources.push(resource);
    }
    resource.actions.push(action);
  }
  return [...applications.values()];
});
const kindEnum = useScopeKindEnum();
const privateCeilingLabel = (actionId: string): string => {
  const ceiling = props.ceilings[actionId];
  if (!ceiling?.scopes.length) return "未配置范围上限";
  return ceiling.scopes
    .map((scope) => {
      const label = kindEnum.getTagText(scope.kind).text;
      if (scope.kind !== ScopeKind.OBJECT_SET) return label;
      const count = Object.values(ceiling.scopeBindings).reduce(
        (sum, binding) => sum + binding.ids.length,
        0,
      );
      return `${label}（${count} 个对象）`;
    })
    .join("、");
};
</script>
