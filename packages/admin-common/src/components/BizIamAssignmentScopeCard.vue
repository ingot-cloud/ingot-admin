<template>
  <div class="rounded-4px p-16px bg-[var(--in-permission-panel-bg)] flex flex-col gap-12px">
    <div class="flex flex-wrap items-center gap-8px">
      <span class="flex-1 min-w-0">{{ item.role.option.name }}</span>
      <el-tag :type="item.configured ? 'success' : 'warning'" size="small">
        {{ item.configured ? "已配置" : "待配置" }}
      </el-tag>
    </div>
    <template v-if="item.actions.length">
      <div>{{ item.actions[0].applicationName }}</div>
      <div class="h-1px bg-[var(--in-border-color)]" />
      <div class="pl-8px flex flex-col gap-8px">
        <div>{{ item.actions[0].resourceName }}</div>
        <div class="pl-24px text-12px text-[var(--el-text-color-secondary)]">
          关联操作：{{ item.actions.map((action) => action.name).join("、") }}
        </div>
        <div class="pl-24px flex flex-col gap-8px">
          <span>范围：指定对象</span>
          <biz-iam-delegation-candidate-picker
            v-if="item.supported"
            :model-value="item.role.bindings[item.parameterKey]?.ids || []"
            :api="api"
            :query="{
              kind: 'OBJECT',
              delegationGrantId,
              revisionId: item.role.option.id,
              parameterKey: item.parameterKey,
            }"
            :selected-options="item.role.selectedObjects[item.parameterKey] || []"
            :load-selected="loadSelected"
            :reset-key="resetKey"
            :disabled="readonly"
            multiple
            title="选择范围对象"
            :placeholder="`请选择${item.actions[0].resourceName}的范围对象`"
            search-placeholder="搜索范围对象"
            @update:model-value="emits('objects', $event)"
            @selection="emits('names', $event)"
          />
        </div>
      </div>
    </template>
    <el-alert
      v-if="!item.supported"
      type="warning"
      :closable="false"
      title="固定版本的范围参数与操作资料不兼容，请检查角色版本。"
    />
  </div>
</template>
<script setup lang="ts">
import type { AuthorizationCandidatesApi, IamSelectOption } from "../models/iam";
import type { AssignmentScopeConfiguration } from "../models/iam/platformAssignment";
import BizIamDelegationCandidatePicker from "./BizIamDelegationCandidatePicker.vue";

defineOptions({ name: "BizIamAssignmentScopeCard" });
defineProps<{
  item: AssignmentScopeConfiguration;
  api: AuthorizationCandidatesApi;
  loadSelected?: AuthorizationCandidatesApi;
  delegationGrantId?: string;
  resetKey: string | number;
  readonly?: boolean;
}>();
const emits = defineEmits<{
  objects: [ids: string | string[]];
  names: [options: IamSelectOption[]];
}>();
</script>
