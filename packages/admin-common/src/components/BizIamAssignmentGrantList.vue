<template>
  <div class="flex flex-col gap-16px">
    <div class="text-12px text-[var(--el-text-color-secondary)]">
      共 {{ rows.length }} 项匹配操作。范围类型由固定角色版本定义，具体对象在“范围配置”中设置。
    </div>
    <el-input v-model="keyword" clearable placeholder="搜索角色、应用、资源或操作">
      <template #prefix><in-icon name="ep:search" /></template>
    </el-input>
    <div v-for="group in groups" :key="group.key" class="flex flex-col gap-8px">
      <div>{{ group.role.option.name }}</div>
      <biz-iam-role-field-summary
        :permissions="group.role.option.resourceFieldPermissions"
        :names="
          Object.fromEntries(
            group.actions.map((action) => [
              action.resourceId,
              `${action.applicationName} / ${action.resourceName}`,
            ]),
          )
        "
      />
      <biz-iam-delegation-operation-tree
        :actions="group.actions"
        :ceilings="group.ceilings"
        show-ceilings
      />
    </div>
    <div v-if="!rows.length" class="text-12px text-[var(--el-text-color-secondary)]">
      暂无匹配操作
    </div>
    <el-pagination
      v-if="rows.length > IAM_DEFAULT_PAGE_SIZE"
      :current-page="page"
      :page-size="IAM_DEFAULT_PAGE_SIZE"
      :total="rows.length"
      layout="prev, pager, next"
      size="small"
      class="justify-end"
      @current-change="page = $event"
    />
  </div>
</template>
<script setup lang="ts">
import {
  IAM_DEFAULT_PAGE_SIZE,
  type ActionScopeCeiling,
  type AuthorizationActionOption,
} from "../models/iam";
import {
  assignmentRoleKey,
  type PlatformAssignmentRoleDraft,
} from "../models/iam/platformAssignment";
import BizIamRoleFieldSummary from "./BizIamRoleFieldSummary.vue";
import BizIamDelegationOperationTree from "./BizIamDelegationOperationTree.vue";

defineOptions({ name: "BizIamAssignmentGrantList" });
const props = defineProps<{ roles: PlatformAssignmentRoleDraft[] }>();
const keyword = ref("");
const page = ref(1);
const rows = computed(() => {
  const search = keyword.value.trim().toLocaleLowerCase();
  return props.roles.flatMap((role) =>
    (role.option.actions || []).flatMap((action) => {
      const grant = role.option.grants?.find((item) => item.actionId === action.id);
      return grant &&
        `${role.option.name} ${action.applicationName} ${action.resourceName} ${action.name}`
          .toLocaleLowerCase()
          .includes(search)
        ? [{ role, action, grant }]
        : [];
    }),
  );
});
const groups = computed(() => {
  const result: Array<{
    key: string;
    role: PlatformAssignmentRoleDraft;
    actions: AuthorizationActionOption[];
    ceilings: Record<string, ActionScopeCeiling>;
  }> = [];
  for (const row of rows.value.slice(
    (page.value - 1) * IAM_DEFAULT_PAGE_SIZE,
    page.value * IAM_DEFAULT_PAGE_SIZE,
  )) {
    const key = assignmentRoleKey(row.role.option);
    let group = result.find((item) => item.key === key);
    if (!group) {
      group = { key, role: row.role, actions: [], ceilings: {} };
      result.push(group);
    }
    group.actions.push(row.action);
    group.ceilings[row.action.id] = {
      ...row.grant,
      scopeBindings: Object.fromEntries(
        row.grant.scopes.flatMap((scope) =>
          scope.parameterKey && row.role.bindings[scope.parameterKey]
            ? [[scope.parameterKey, row.role.bindings[scope.parameterKey]]]
            : [],
        ),
      ),
    };
  }
  return result;
});
watch(keyword, () => {
  page.value = 1;
});
watch(rows, () => {
  page.value = Math.min(
    page.value,
    Math.max(1, Math.ceil(rows.value.length / IAM_DEFAULT_PAGE_SIZE)),
  );
});
</script>
