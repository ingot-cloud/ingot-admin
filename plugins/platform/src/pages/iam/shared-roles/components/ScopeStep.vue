<template>
  <div class="flex flex-col gap-24px">
    <div class="text-12px text-[var(--el-text-color-secondary)]">
      {{ domain === AuthorizationDomain.PLATFORM
        ? "此处定义角色允许使用的范围；指定对象在分配角色时选择。"
        : "此处确定共享角色的范围类型；管理部门和指定对象由租户在分配角色时选择。" }}
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
          <span v-if="needsParameter(grant.scopes[0]?.kind ?? ScopeKind.ALL)" class="text-12px text-[var(--el-text-color-secondary)]">
            {{ grant.scopes[0]?.kind === ScopeKind.MANAGED_DEPARTMENTS ? "分配时选择管理部门" : "分配时选择指定对象" }}
          </span>
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
import { AuthorizationDomain, ScopeKind, useScopeKindEnum } from "@ingot/admin-common";
import { allowsDescendants, groupGrants, needsParameter, parameterKeyFor, type SelectedGrant } from "../wizard";

defineOptions({ name: "ScopeStep" });

type CheckboxValue = boolean | string | number;
const props = defineProps<{ domain: AuthorizationDomain }>();

const grants = defineModel<SelectedGrant[]>({ default: () => [] });
const kindEnum = useScopeKindEnum();
const groups = computed(() => groupGrants(grants.value));

const kindOptions = (grant: SelectedGrant) =>
  kindEnum.getOptions().filter((item) =>
    grant.scopeCapabilities.includes(item.value) &&
    (props.domain !== AuthorizationDomain.PLATFORM ||
      (item.value !== ScopeKind.MEMBER_DEPARTMENTS && item.value !== ScopeKind.MANAGED_DEPARTMENTS)));

const replaceScope = (grant: SelectedGrant, scope: SelectedGrant["scopes"][number]): void => {
  grants.value = grants.value.map((item) =>
    item.actionId === grant.actionId ? { ...item, scopes: [scope] } : item,
  );
};

const privateOnKind = (grant: SelectedGrant, kind: ScopeKind): void => {
  const previous = grant.scopes[0];
  const parameterKey = needsParameter(kind)
    ? previous?.kind === kind && previous.parameterKey?.trim()
      ? previous.parameterKey
      : parameterKeyFor(grant.resourceId, kind)
    : undefined;
  replaceScope(grant, parameterKey ? { kind, parameterKey } : { kind });
};

const privateOnDescendants = (grant: SelectedGrant, includeDescendants: boolean): void => {
  const current = grant.scopes[0] ?? { kind: ScopeKind.ALL };
  replaceScope(grant, { ...current, includeDescendants });
};
</script>
