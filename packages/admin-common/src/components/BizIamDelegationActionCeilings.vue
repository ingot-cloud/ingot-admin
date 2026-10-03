<template>
  <div class="flex flex-col gap-6px w-full">
    <button
      type="button"
      :disabled="disabled || !actions.length"
      aria-label="配置逐操作范围上限"
      class="flex items-center justify-between gap-8px box-border w-full min-h-[var(--in-control-height)] px-11px py-6px border border-solid border-[var(--el-border-color)] rounded-[var(--el-border-radius-base)] bg-[var(--el-fill-color-blank)] text-left"
      :class="
        disabled || !actions.length
          ? 'cursor-not-allowed opacity-60'
          : 'cursor-pointer hover:border-[var(--el-color-primary)]'
      "
      @click="privateOpen"
    >
      <span>{{
        actions.length ? `已配置 ${configuredCount} / ${actions.length} 项操作` : "先选择角色版本"
      }}</span>
      <in-icon name="ep:edit" class="text-[var(--el-text-color-secondary)]" />
    </button>
    <span class="text-12px text-[var(--el-text-color-secondary)]"
      >所选角色版本中的每个操作都必须配置上限。</span
    >
  </div>
  <in-dialog
    v-model="visible"
    title="配置逐操作范围上限"
    width="960px"
    layout="pinned"
    append-to-body
  >
    <div class="in-split-picker h-500px flex min-w-0">
      <div class="w-1/2 min-w-0 flex flex-col overflow-hidden">
        <div class="p-12px">
          <el-input
            v-model="keyword"
            clearable
            placeholder="搜索应用、资源或操作"
            @input="privateSearch"
          >
            <template #prefix><in-icon name="ep:search" /></template>
          </el-input>
        </div>
        <div class="flex-1 min-h-0 overflow-auto px-12px">
          <button
            v-for="action in pagedActions"
            :key="action.id"
            type="button"
            :aria-pressed="selectedActionId === action.id"
            class="flex items-center gap-8px w-full px-8px py-10px border-none rounded-[var(--el-border-radius-base)] bg-transparent cursor-pointer text-left hover:bg-[var(--el-fill-color-light)]"
            @click="selectedActionId = action.id"
          >
            <in-icon
              :name="
                privateConfigured(draft[action.id]) ? 'ep:circle-check-filled' : 'ep:circle-check'
              "
              :class="
                privateConfigured(draft[action.id])
                  ? 'text-[var(--el-color-primary)]'
                  : 'text-[var(--el-text-color-placeholder)]'
              "
            />
            <span class="flex-1 min-w-0 truncate"
              >{{ action.applicationName }} / {{ action.resourceName }} / {{ action.name }}</span
            >
          </button>
          <div v-if="!pagedActions.length" class="py-16px text-[var(--el-text-color-secondary)]">
            暂无匹配操作
          </div>
        </div>
        <el-pagination
          v-if="filteredActions.length > IAM_DEFAULT_PAGE_SIZE"
          class="shrink-0 justify-end p-12px"
          :current-page="page"
          :page-size="IAM_DEFAULT_PAGE_SIZE"
          :total="filteredActions.length"
          layout="prev, pager, next"
          small
          @current-change="page = $event"
        />
      </div>
      <div class="w-1/2 min-w-0 flex flex-col overflow-auto p-16px">
        <template v-if="selectedAction">
          <div class="font-medium mb-16px">
            {{ selectedAction.applicationName }} / {{ selectedAction.resourceName }} /
            {{ selectedAction.name }}
          </div>
          <span class="mb-6px">允许范围</span>
          <el-select
            :model-value="privateScopeKinds(selectedAction.id)"
            multiple
            placeholder="请选择允许范围"
            :disabled="disabled"
            @change="(values: ScopeKind[]) => privateSetScopes(selectedAction!, values)"
          >
            <el-option
              v-for="kind in privateAvailableScopes(selectedAction)"
              :key="kind"
              :value="kind"
              :label="privateScopeLabel(kind)"
            />
          </el-select>
          <div
            v-if="privateScopeKinds(selectedAction.id).includes(ScopeKind.OBJECT_SET)"
            class="mt-16px"
          >
            <span class="block mb-6px">指定对象</span>
            <biz-iam-delegation-candidate-picker
              :model-value="privateObjectIds(selectedAction.id)"
              :api="api"
              :query="{ kind: 'OBJECT', actionId: selectedAction.id }"
              multiple
              title="选择范围对象"
              placeholder="请选择本资源的范围对象"
              search-placeholder="搜索范围对象"
              :disabled="disabled"
              @update:model-value="privateSetObjects(selectedAction, $event)"
            />
            <in-button
              v-if="!disabled"
              class="mt-8px"
              @in-click="privateReuseObjects(selectedAction)"
              >复用于本资源其他操作</in-button
            >
          </div>
        </template>
        <div v-else class="text-[var(--el-text-color-secondary)]">选择左侧操作后配置范围上限</div>
      </div>
    </div>
    <template #footer>
      <span class="mr-auto text-[var(--el-text-color-secondary)]"
        >已配置 {{ draftConfiguredCount }} / {{ actions.length }} 项</span
      >
      <in-button @in-click="visible = false">取消</in-button>
      <in-button type="primary" @in-click="privateConfirm">确定</in-button>
    </template>
  </in-dialog>
</template>

<script setup lang="ts">
import {
  IAM_DEFAULT_PAGE_SIZE,
  ScopeBindingKind,
  ScopeKind,
  useScopeKindEnum,
  type ActionScopeCeiling,
  type AuthorizationActionOption,
  type AuthorizationCandidatesApi,
} from "../models/iam";
import BizIamDelegationCandidatePicker from "./BizIamDelegationCandidatePicker.vue";

defineOptions({ name: "BizIamDelegationActionCeilings" });
const props = defineProps<{
  actions: AuthorizationActionOption[];
  api: AuthorizationCandidatesApi;
  disabled?: boolean;
  resetKey: string | number;
}>();
const model = defineModel<Record<string, ActionScopeCeiling>>({ default: () => ({}) });
const visible = ref(false);
const draft = ref<Record<string, ActionScopeCeiling>>({});
const keyword = ref("");
const page = ref(1);
const selectedActionId = ref("");
const kindEnum = useScopeKindEnum();
const privateScopeLabel = (kind: ScopeKind): string => kindEnum.getTagText(kind).text;
const privateAvailableScopes = (action: AuthorizationActionOption): ScopeKind[] =>
  action.scopeCapabilities.filter(
    (kind) => kind !== ScopeKind.MEMBER_DEPARTMENTS && kind !== ScopeKind.MANAGED_DEPARTMENTS,
  );
const privateScopeKinds = (id: string): ScopeKind[] =>
  draft.value[id]?.scopes.map((scope) => scope.kind) || [];
const privateObjectIds = (id: string): string[] =>
  Object.values(draft.value[id]?.scopeBindings || {}).flatMap((binding) => binding.ids);
const privateConfigured = (ceiling?: ActionScopeCeiling): boolean =>
  !!ceiling?.scopes.length &&
  (!ceiling.scopes.some((scope) => scope.kind === ScopeKind.OBJECT_SET) ||
    Object.values(ceiling.scopeBindings).some((binding) => binding.ids.length > 0));
const configuredCount = computed(
  () => props.actions.filter((action) => privateConfigured(model.value[action.id])).length,
);
const draftConfiguredCount = computed(
  () => props.actions.filter((action) => privateConfigured(draft.value[action.id])).length,
);
const filteredActions = computed(() => {
  const value = keyword.value.trim().toLocaleLowerCase();
  return value
    ? props.actions.filter((action) =>
        `${action.applicationName} ${action.resourceName} ${action.name}`
          .toLocaleLowerCase()
          .includes(value),
      )
    : props.actions;
});
const pagedActions = computed(() =>
  filteredActions.value.slice(
    (page.value - 1) * IAM_DEFAULT_PAGE_SIZE,
    page.value * IAM_DEFAULT_PAGE_SIZE,
  ),
);
const selectedAction = computed(() =>
  props.actions.find((action) => action.id === selectedActionId.value),
);
const privateObjectKey = (action: AuthorizationActionOption): string =>
  `objects_${action.resourceId}`;
const privateCopyCeilings = (
  values: Record<string, ActionScopeCeiling>,
): Record<string, ActionScopeCeiling> =>
  Object.fromEntries(
    Object.entries(values).map(([id, ceiling]) => [
      id,
      {
        actionId: ceiling.actionId,
        scopes: ceiling.scopes.map((scope) => ({ ...scope })),
        scopeBindings: Object.fromEntries(
          Object.entries(ceiling.scopeBindings).map(([key, binding]) => [
            key,
            { ...binding, ids: [...binding.ids] },
          ]),
        ),
      },
    ]),
  );
const privateSetScopes = (action: AuthorizationActionOption, values: ScopeKind[]): void => {
  const key = privateObjectKey(action);
  const old = draft.value[action.id];
  draft.value[action.id] = {
    actionId: action.id,
    scopes: values.map((kind) =>
      kind === ScopeKind.OBJECT_SET ? { kind, parameterKey: key } : { kind },
    ),
    scopeBindings: values.includes(ScopeKind.OBJECT_SET)
      ? { [key]: old?.scopeBindings[key] || { kind: ScopeBindingKind.OBJECTS, ids: [] } }
      : {},
  };
};
const privateSetObjects = (action: AuthorizationActionOption, value: string | string[]): void => {
  const key = privateObjectKey(action);
  draft.value[action.id].scopeBindings = {
    [key]: { kind: ScopeBindingKind.OBJECTS, ids: Array.isArray(value) ? value : [] },
  };
};
const privateReuseObjects = (action: AuthorizationActionOption): void => {
  for (const other of props.actions) {
    if (
      other.resourceId === action.resourceId &&
      privateScopeKinds(other.id).includes(ScopeKind.OBJECT_SET)
    )
      privateSetObjects(other, [...privateObjectIds(action.id)]);
  }
};
const privateOpen = (): void => {
  if (props.disabled || !props.actions.length) return;
  draft.value = privateCopyCeilings(model.value);
  keyword.value = "";
  page.value = 1;
  selectedActionId.value = props.actions[0].id;
  visible.value = true;
};
const privateSearch = (): void => {
  page.value = 1;
  selectedActionId.value = filteredActions.value[0]?.id || "";
};
const privateConfirm = (): void => {
  model.value = privateCopyCeilings(draft.value);
  visible.value = false;
};
watch(
  () => props.resetKey,
  () => {
    visible.value = false;
  },
);
</script>
