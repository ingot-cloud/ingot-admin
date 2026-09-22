<template>
  <div class="flex flex-col gap-24px">
    <div class="text-12px text-[var(--el-text-color-secondary)]">
      所在部门跟着成员任职走；管理部门要在以后分配时再指定。
    </div>
    <div v-for="app in groups" :key="app.applicationId" class="flex flex-col gap-16px">
      <div class="text-[var(--in-text-color)]">{{ app.applicationName }}</div>
      <div v-for="resource in app.resources" :key="resource.resourceId" class="pl-8px flex flex-col gap-12px">
        <div class="text-12px text-[var(--el-text-color-secondary)]">{{ resource.resourceName }}</div>
        <div
          v-for="grant in resource.grants"
          :key="grant.actionId"
          class="flex flex-wrap items-center gap-8px"
        >
          <span class="w-140px shrink-0 truncate">{{ grant.actionName }}</span>
          <el-select
            :model-value="grant.scopes[0]?.kind"
            class="w-160px!"
            placeholder="请选择范围"
            @change="(value: ScopeKind) => privateOnKind(grant, value)"
          >
            <el-option
              v-for="option in kindOptions(grant)"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
          <el-input
            v-if="needsParameter(grant.scopes[0]?.kind ?? ScopeKind.ALL)"
            :model-value="grant.scopes[0]?.parameterKey"
            class="w-160px"
            placeholder="请输入参数键"
            @change="(value: string) => privateOnParameter(grant, value)"
          />
          <el-checkbox
            v-if="allowsDescendants(grant.scopes[0]?.kind ?? ScopeKind.ALL)"
            :model-value="Boolean(grant.scopes[0]?.includeDescendants)"
            @change="(value: CheckboxValue) => privateOnDescendants(grant, Boolean(value))"
          >
            含下级
          </el-checkbox>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ScopeKind, useScopeKindEnum } from "@ingot/admin-common";
import { allowsDescendants, groupGrants, needsParameter, type SelectedGrant } from "../wizard";

defineOptions({ name: "ScopeStep" });

type CheckboxValue = boolean | string | number;

const grants = defineModel<SelectedGrant[]>({ default: () => [] });
const kindEnum = useScopeKindEnum();
const groups = computed(() => groupGrants(grants.value));

const kindOptions = (grant: SelectedGrant) =>
  kindEnum.getOptions().filter((item) => grant.scopeCapabilities.includes(item.value));

const replaceScope = (grant: SelectedGrant, scope: SelectedGrant["scopes"][number]): void => {
  grants.value = grants.value.map((item) =>
    item.actionId === grant.actionId ? { ...item, scopes: [scope] } : item,
  );
};

const privateOnKind = (grant: SelectedGrant, kind: ScopeKind): void => {
  replaceScope(grant, { kind });
};

const privateOnParameter = (grant: SelectedGrant, parameterKey: string): void => {
  const current = grant.scopes[0] ?? { kind: ScopeKind.ALL };
  replaceScope(grant, { ...current, parameterKey });
};

const privateOnDescendants = (grant: SelectedGrant, includeDescendants: boolean): void => {
  const current = grant.scopes[0] ?? { kind: ScopeKind.ALL };
  replaceScope(grant, { ...current, includeDescendants });
};
</script>
