<template>
  <div class="flex flex-col gap-16px">
    <template v-if="!readonly">
      <biz-iam-delegation-candidate-picker
        v-model="applicationId"
        :api="applicationCandidates"
        :query="{ kind: 'APPLICATION' }"
        title="选择应用"
        placeholder="请选择已开通应用"
        search-placeholder="搜索应用名"
      />
      <el-input
        v-if="applicationId"
        v-model="keyword"
        placeholder="搜索权限名称"
        clearable
        @keyup.enter="privateSearch"
        @clear="privateSearch"
      />
      <in-loading :loading="loading">
        <el-checkbox
          v-for="action in actions"
          :key="action.actionId"
          :model-value="definition.grants.some((g) => g.actionId === action.actionId)"
          @change="privateToggle(action)"
          >{{ action.resourceName }} / {{ action.actionName }}</el-checkbox
        >
      </in-loading>
    </template>
    <div
      v-for="grant in definition.grants"
      :key="grant.actionId"
      class="p-12px border border-solid border-[var(--in-border-color)] rounded-4px"
    >
      <div class="flex justify-between mb-8px">
        <span
          >{{ itemOf(grant.actionId)?.resourceName }} /
          {{ itemOf(grant.actionId)?.actionName || grant.actionId
          }}{{ itemOf(grant.actionId)?.enabled === false ? "（已停用）" : "" }}</span
        ><in-button v-if="!readonly" text type="danger" @in-click="privateRemove(grant.actionId)"
          >移除</in-button
        >
      </div>
      <div v-for="(scope, index) in grant.scopes" :key="index" class="flex gap-8px items-center">
        <el-select
          v-model="scope.kind"
          :disabled="readonly || itemOf(grant.actionId)?.enabled === false"
          placeholder="请选择数据范围"
          @change="privateScope(grant.actionId, index)"
          ><el-option
            v-for="kind in itemOf(grant.actionId)?.scopeCapabilities || []"
            :key="kind"
            :label="formatScopeKinds([kind])"
            :value="kind"
        /></el-select>
        <el-checkbox
          v-if="
            scope.kind === ScopeKind.MANAGED_DEPARTMENTS ||
            scope.kind === ScopeKind.MEMBER_DEPARTMENTS
          "
          v-model="scope.includeDescendants"
          :disabled="readonly || itemOf(grant.actionId)?.enabled === false"
          >含下级</el-checkbox
        >
        <in-button v-if="!readonly" text @in-click="privateRemoveScope(grant.actionId, index)"
          >删除范围</in-button
        >
      </div>
      <in-button
        v-if="!readonly && itemOf(grant.actionId)?.enabled !== false"
        text
        @in-click="privateAddScope(grant.actionId)"
        >添加范围</in-button
      >
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, watch } from "vue";
import { useCapabilities } from "@ingot/admin-core";
import type {
  AuthorizationCandidatesApi,
  CurrentGrantCatalogAPI,
  CurrentRoleCatalogAction,
  CurrentRoleDefinition,
} from "../../models/iam";
import { ScopeKind, formatScopeKinds } from "../../models/iam";
import BizIamDelegationCandidatePicker from "../BizIamDelegationCandidatePicker.vue";
import { iamEditorFailure } from "../../hooks/iamEditorFailure";
const props = defineProps<{
  readonly?: boolean;
  items: CurrentRoleCatalogAction[];
  catalogAPI: CurrentGrantCatalogAPI;
  applicationCandidates: AuthorizationCandidatesApi;
}>();
const definition = defineModel<CurrentRoleDefinition>({ required: true });
const { contextEpoch } = useCapabilities();
watch(contextEpoch, () => {
  epoch += 1;
  applicationId.value = "";
  actions.value = [];
  loaded.value = [];
  loading.value = false;
});
const applicationId = ref("");
const keyword = ref("");
const actions = ref<CurrentRoleCatalogAction[]>([]);
const loaded = ref<CurrentRoleCatalogAction[]>([]);
const loading = ref(false);
let epoch = 0;
const itemOf = (id: string) =>
  props.items.find((i) => i.actionId === id) || loaded.value.find((i) => i.actionId === id);
const privateLoad = async () => {
  const current = ++epoch;
  loading.value = true;
  try {
    const result = await props.catalogAPI(applicationId.value, keyword.value);
    if (current !== epoch) return;
    actions.value = result.data || [];
    loaded.value = [...loaded.value, ...actions.value];
  } catch (error) {
    iamEditorFailure(error);
  } finally {
    if (current === epoch) loading.value = false;
  }
};
const privateSearch = () => {
  void privateLoad();
};
watch(applicationId, () => {
  actions.value = [];
  if (applicationId.value) privateSearch();
  else { epoch += 1; loading.value = false; }
});
const privateSync = () => {
  const used = new Set(
    definition.value.grants.flatMap((g) =>
      g.scopes.map((s) => s.parameterKey).filter((key): key is string => !!key),
    ),
  );
  definition.value = {
    grants: [...definition.value.grants],
    parameterDefinitions: definition.value.parameterDefinitions.filter((p) => used.has(p.key)),
  };
};
const privateRemoveScope = (id: string, index: number) => {
  definition.value.grants.find((grant) => grant.actionId === id)?.scopes.splice(index, 1);
  privateSync();
};
const privateRemove = (id: string) => {
  definition.value.grants = definition.value.grants.filter((g) => g.actionId !== id);
  privateSync();
};
const privateToggle = (action: CurrentRoleCatalogAction) => {
  if (definition.value.grants.some((g) => g.actionId === action.actionId)) {
    privateRemove(action.actionId);
    return;
  }
  definition.value.grants.push({ actionId: action.actionId, scopes: [] });
  privateAddScope(action.actionId);
};
const privateAddScope = (id: string) => {
  const grant = definition.value.grants.find((g) => g.actionId === id)!;
  const kind = itemOf(id)?.scopeCapabilities[0];
  if (kind) {
    grant.scopes.push({ kind });
    privateScope(id, grant.scopes.length - 1);
  }
};
const privateScope = (id: string, index: number) => {
  const scope = definition.value.grants.find((g) => g.actionId === id)!.scopes[index];
  const item = itemOf(id);
  delete scope.parameterKey;
  delete scope.includeDescendants;
  if (scope.kind === ScopeKind.MANAGED_DEPARTMENTS || scope.kind === ScopeKind.OBJECT_SET) {
    const parameter =
      definition.value.parameterDefinitions.find(
        (p) =>
          p.resourceId === item?.resourceId &&
          p.kind === (scope.kind === ScopeKind.MANAGED_DEPARTMENTS ? "DEPARTMENTS" : "OBJECTS"),
      ) ||
      item?.parameterDefinitions.find(
        (p) =>
          p.kind === (scope.kind === ScopeKind.MANAGED_DEPARTMENTS ? "DEPARTMENTS" : "OBJECTS"),
      );
    if (parameter) {
      scope.parameterKey = parameter.key;
      if (!definition.value.parameterDefinitions.some((p) => p.key === parameter.key))
        definition.value.parameterDefinitions.push({ ...parameter });
    }
  }
  privateSync();
};
</script>
