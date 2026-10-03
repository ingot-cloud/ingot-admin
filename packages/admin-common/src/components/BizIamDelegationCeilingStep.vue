<template>
  <div v-if="viewOnly" class="flex flex-col gap-16px max-w-720px">
    <div class="text-12px text-[var(--el-text-color-secondary)]">
      所选角色版本共包含 {{ actions.length }} 项操作；全部进入委派，不能在此移除。
    </div>
    <el-input v-model="keyword" clearable placeholder="搜索应用、资源或操作" @input="page = 1">
      <template #prefix><in-icon name="ep:search" /></template>
    </el-input>
    <biz-iam-delegation-operation-tree :actions="pagedActions" />
    <el-pagination
      v-if="filteredActions.length > IAM_DEFAULT_PAGE_SIZE"
      class="justify-end"
      :current-page="page"
      :page-size="IAM_DEFAULT_PAGE_SIZE"
      :total="filteredActions.length"
      layout="prev, pager, next"
      size="small"
      @current-change="page = $event"
    />
  </div>
  <div v-else class="flex h-full min-h-0 flex-col gap-16px">
    <div class="text-12px text-[var(--el-text-color-secondary)]">
      已配置 {{ configuredCount }} /
      {{ actions.length }} 项操作；逐条设置范围上限，指定对象从所属资源中选择。
    </div>
    <el-input v-model="keyword" clearable placeholder="搜索应用、资源或操作" @input="page = 1">
      <template #prefix><in-icon name="ep:search" /></template>
    </el-input>
    <div class="flex-1 min-h-0 overflow-auto flex flex-col gap-24px">
      <div v-for="app in pagedGroups" :key="app.id" class="flex flex-col gap-16px">
        <div class="text-[var(--in-text-color)]">{{ app.name }}</div>
        <div
          v-for="resource in app.resources"
          :key="resource.id"
          class="pl-8px flex flex-col gap-12px"
        >
          <div class="flex flex-wrap items-center gap-12px">
            <span class="text-12px text-[var(--el-text-color-secondary)]">{{ resource.name }}</span>
            <el-select
              v-if="!disabled"
              class="w-240px"
              placeholder="批量设置本资源范围"
              :model-value="undefined"
              @change="(kind: ScopeKind) => applyResourceScope(resource.id, kind)"
            >
              <el-option
                v-for="kind in resourceScopes(resource.id)"
                :key="kind"
                :value="kind"
                :label="scopeLabel(kind)"
              />
            </el-select>
          </div>
          <div v-for="action in resource.actions" :key="action.id" class="flex flex-col gap-8px">
            <div class="flex flex-wrap items-center gap-8px">
              <span class="w-140px shrink-0 truncate">{{ action.name }}</span>
              <el-select
                :model-value="scopeKinds(action.id)"
                multiple
                class="w-320px max-w-full"
                placeholder="请选择允许范围"
                :disabled="disabled"
                @change="(values: ScopeKind[]) => setScopes(action, values)"
              >
                <el-option
                  v-for="kind in availableScopes(action)"
                  :key="kind"
                  :value="kind"
                  :label="scopeLabel(kind)"
                />
              </el-select>
            </div>
            <div
              v-if="scopeKinds(action.id).includes(ScopeKind.OBJECT_SET)"
              class="delegation-object-field flex flex-col items-start gap-8px"
            >
              <biz-iam-delegation-candidate-picker
                :model-value="objectIds(action.id)"
                class="w-320px max-w-full"
                :api="api"
                :query="{ kind: 'OBJECT', actionId: action.id }"
                :selected-options="objectSelections[action.resourceId] || []"
                :load-selected="selectedApi"
                :reset-key="resetKey"
                @selection="objectSelections[action.resourceId] = $event"
                multiple
                title="选择范围对象"
                placeholder="请选择本资源的范围对象"
                search-placeholder="搜索范围对象"
                :disabled="disabled"
                @update:model-value="setObjects(action, $event)"
              />
              <in-button v-if="!disabled" @in-click="reuseObjects(action)"
                >应用到本资源其他操作</in-button
              >
            </div>
          </div>
        </div>
      </div>
      <div v-if="!pagedActions.length" class="text-[var(--el-text-color-secondary)] py-16px">
        暂无匹配操作
      </div>
    </div>
    <el-pagination
      v-if="filteredActions.length > IAM_DEFAULT_PAGE_SIZE"
      class="shrink-0 justify-end"
      :current-page="page"
      :page-size="IAM_DEFAULT_PAGE_SIZE"
      :total="filteredActions.length"
      layout="prev, pager, next"
      size="small"
      @current-change="page = $event"
    />
  </div>
</template>

<script setup lang="ts">
import { Confirm } from "@ingot/admin-core";
import {
  IAM_DEFAULT_PAGE_SIZE,
  ScopeBindingKind,
  ScopeKind,
  useScopeKindEnum,
  type ActionScopeCeiling,
  type AuthorizationActionOption,
  type AuthorizationCandidatesApi,
  type AuthorizationOption,
} from "../models/iam";
import BizIamDelegationCandidatePicker from "./BizIamDelegationCandidatePicker.vue";
import BizIamDelegationOperationTree from "./BizIamDelegationOperationTree.vue";

defineOptions({ name: "BizIamDelegationCeilingStep" });
const props = defineProps<{
  actions: AuthorizationActionOption[];
  api: AuthorizationCandidatesApi;
  viewOnly?: boolean;
  disabled?: boolean;
  selectedApi?: AuthorizationCandidatesApi;
  resetKey?: string | number;
}>();
const model = defineModel<Record<string, ActionScopeCeiling>>({ default: () => ({}) });
const objectSelections = defineModel<Record<string, AuthorizationOption[]>>("objectSelections", {
  default: () => ({}),
});
const keyword = ref("");
const page = ref(1);
const kindEnum = useScopeKindEnum();
const scopeLabel = (kind: ScopeKind): string => kindEnum.getTagText(kind).text;
const availableScopes = (action: AuthorizationActionOption): ScopeKind[] =>
  action.scopeCapabilities.filter(
    (kind) => kind !== ScopeKind.MEMBER_DEPARTMENTS && kind !== ScopeKind.MANAGED_DEPARTMENTS,
  );
const scopeKinds = (id: string): ScopeKind[] =>
  model.value[id]?.scopes.map((scope) => scope.kind) ?? [];
const objectIds = (id: string): string[] =>
  Object.values(model.value[id]?.scopeBindings ?? {}).flatMap((binding) => binding.ids);
const configuredCount = computed(
  () =>
    props.actions.filter((action) => {
      const ceiling = model.value[action.id];
      return (
        !!ceiling?.scopes.length &&
        (!ceiling.scopes.some((scope) => scope.kind === ScopeKind.OBJECT_SET) ||
          Object.values(ceiling.scopeBindings).some((binding) => binding.ids.length > 0))
      );
    }).length,
);
const filteredActions = computed(() => {
  const search = keyword.value.trim().toLocaleLowerCase();
  return search
    ? props.actions.filter((action) =>
        `${action.applicationName} ${action.resourceName} ${action.name}`
          .toLocaleLowerCase()
          .includes(search),
      )
    : props.actions;
});
const pagedActions = computed(() =>
  filteredActions.value.slice(
    (page.value - 1) * IAM_DEFAULT_PAGE_SIZE,
    page.value * IAM_DEFAULT_PAGE_SIZE,
  ),
);
const pagedGroups = computed(() => {
  const applications = new Map<
    string,
    {
      id: string;
      name: string;
      resources: Array<{
        id: string;
        name: string;
        actions: AuthorizationActionOption[];
      }>;
    }
  >();
  for (const action of pagedActions.value) {
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
const objectKey = (action: AuthorizationActionOption): string => `objects_${action.resourceId}`;
const setScopesInDraft = (
  draft: Record<string, ActionScopeCeiling>,
  action: AuthorizationActionOption,
  values: ScopeKind[],
): void => {
  const current = draft[action.id];
  const previous = current?.scopes.map((scope) => scope.kind) ?? [];
  values = values.includes(ScopeKind.ALL)
    ? previous.includes(ScopeKind.ALL) && values.length > 1
      ? values.filter((kind) => kind !== ScopeKind.ALL)
      : [ScopeKind.ALL]
    : values;
  const key = objectKey(action);
  draft[action.id] = {
    actionId: action.id,
    scopes: values.map((kind) =>
      kind === ScopeKind.OBJECT_SET ? { kind, parameterKey: key } : { kind },
    ),
    scopeBindings: values.includes(ScopeKind.OBJECT_SET)
      ? { [key]: current?.scopeBindings[key] ?? { kind: ScopeBindingKind.OBJECTS, ids: [] } }
      : {},
  };
};
const setScopes = (action: AuthorizationActionOption, values: ScopeKind[]): void => {
  const next = { ...model.value };
  setScopesInDraft(next, action, values);
  model.value = next;
};
const setObjectsInDraft = (
  draft: Record<string, ActionScopeCeiling>,
  action: AuthorizationActionOption,
  ids: string | string[],
): void => {
  const key = objectKey(action);
  const current = draft[action.id];
  if (!current) return;
  draft[action.id] = {
    ...current,
    scopeBindings: {
      [key]: { kind: ScopeBindingKind.OBJECTS, ids: Array.isArray(ids) ? [...ids] : [] },
    },
  };
};
const setObjects = (action: AuthorizationActionOption, ids: string | string[]): void => {
  if (!model.value[action.id]) return;
  const next = { ...model.value };
  setObjectsInDraft(next, action, ids);
  model.value = next;
};
const resourceActions = (id: string): AuthorizationActionOption[] =>
  props.actions.filter((action) => action.resourceId === id);
const resourceScopes = (id: string): ScopeKind[] => {
  const actions = resourceActions(id);
  return actions.length
    ? availableScopes(actions[0]).filter((kind) =>
        actions.every((action) => availableScopes(action).includes(kind)),
      )
    : [];
};
const applyResourceScope = async (id: string, kind: ScopeKind): Promise<void> => {
  const targets = resourceActions(id);
  if (!targets.length) return;
  if (
    targets.some(
      (action) =>
        scopeKinds(action.id).length &&
        (scopeKinds(action.id).length !== 1 || scopeKinds(action.id)[0] !== kind),
    )
  ) {
    try {
      await Confirm.warning(`将覆盖本资源 ${targets.length} 项操作的范围配置，是否继续？`);
    } catch {
      return;
    }
  }
  const next = { ...model.value };
  targets.forEach((action) => setScopesInDraft(next, action, [kind]));
  model.value = next;
};
const reuseObjects = async (action: AuthorizationActionOption): Promise<void> => {
  const ids = [...objectIds(action.id)];
  const targets = resourceActions(action.resourceId).filter(
    (other) => other.id !== action.id && scopeKinds(other.id).includes(ScopeKind.OBJECT_SET),
  );
  if (!targets.length) return;
  if (
    targets.some(
      (other) =>
        objectIds(other.id).length &&
        JSON.stringify([...objectIds(other.id)].sort()) !== JSON.stringify([...ids].sort()),
    )
  ) {
    try {
      await Confirm.warning(`将覆盖本资源其他 ${targets.length} 项操作的指定对象，是否继续？`);
    } catch {
      return;
    }
  }
  const next = { ...model.value };
  targets.forEach((other) => setObjectsInDraft(next, other, ids));
  model.value = next;
};
watch(
  () => props.actions,
  () => {
    page.value = 1;
    keyword.value = "";
  },
);
</script>

<style lang="postcss" scoped>
@media (max-width: 700px) {
  .delegation-object-field {
    padding-left: 0;
  }
}
</style>
