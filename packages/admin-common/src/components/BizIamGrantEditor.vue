<template>
  <div class="flex flex-col gap-16px">
    <div class="flex flex-col gap-8px">
      <div class="text-sm">逐操作授权</div>
      <div
        v-for="(item, index) in model.grants"
        :key="`grant-${index}`"
        class="flex flex-col gap-8px rounded-4px p-12px b b-solid b-[var(--el-border-color)]"
      >
        <div class="flex items-center gap-8px">
          <el-input v-model="item.actionId" placeholder="操作 ID" @change="privateTouch" />
          <el-button text type="danger" @click="privateRemoveGrant(index)">删除</el-button>
        </div>
        <biz-iam-scope-editor v-model="item.scopes" />
      </div>
      <el-button text type="primary" @click="privateAddGrant">添加操作</el-button>
    </div>
    <div v-if="allowDeltas" class="flex flex-col gap-8px">
      <div class="text-sm">租户差异</div>
      <biz-iam-delta-tags :items="model.deltas" />
      <div
        v-for="(item, index) in model.deltas"
        :key="`delta-${index}`"
        class="flex flex-col gap-8px rounded-4px p-12px b b-solid b-[var(--el-border-color)]"
      >
        <div class="flex flex-wrap items-center gap-8px">
          <el-input v-model="item.actionId" placeholder="操作 ID" class="w-200px" @change="privateTouch" />
          <el-select v-model="item.operation" class="w-140px" @change="privateTouch">
            <el-option
              v-for="option in deltaOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
          <el-button text type="danger" @click="privateRemoveDelta(index)">删除</el-button>
        </div>
        <biz-iam-scope-editor v-if="needsDeltaScopes(item.operation)" v-model="item.scopes" />
      </div>
      <el-button text type="primary" @click="privateAddDelta">添加差异</el-button>
    </div>
    <div class="flex flex-col gap-8px">
      <div class="text-sm">命名参数</div>
      <div
        v-for="(item, index) in model.parameterDefinitions"
        :key="`param-${index}`"
        class="flex flex-wrap items-center gap-8px"
      >
        <el-input v-model="item.key" placeholder="参数键" class="w-160px" @change="privateTouch" />
        <el-select v-model="item.kind" class="w-160px" @change="privateTouch">
          <el-option
            v-for="option in bindingOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
        <el-button text type="danger" @click="privateRemoveParameter(index)">删除</el-button>
      </div>
      <el-button text type="primary" @click="privateAddParameter">添加参数</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  RoleDeltaOperation,
  ScopeBindingKind,
  ScopeKind,
  useRoleDeltaOperationEnum,
  useScopeBindingKindEnum,
  type RoleDefinitionDraft,
} from "../models/iam";

defineOptions({ name: "BizIamGrantEditor" });

withDefaults(
  defineProps<{
    allowDeltas?: boolean;
  }>(),
  {
    allowDeltas: false,
  },
);

const model = defineModel<RoleDefinitionDraft>({
  default: () => ({ grants: [], deltas: [], parameterDefinitions: [] }),
});
const deltaOptions = useRoleDeltaOperationEnum().getOptions();
const bindingOptions = useScopeBindingKindEnum().getOptions();

const privateTouch = (): void => {
  model.value = {
    grants: [...model.value.grants],
    deltas: [...model.value.deltas],
    parameterDefinitions: [...model.value.parameterDefinitions],
    metadataOverrides: model.value.metadataOverrides,
  };
};

const needsDeltaScopes = (operation: RoleDeltaOperation): boolean =>
  operation === RoleDeltaOperation.ADD || operation === RoleDeltaOperation.REPLACE_SCOPE;

const privateAddGrant = (): void => {
  model.value = {
    ...model.value,
    grants: [...model.value.grants, { actionId: "", scopes: [{ kind: ScopeKind.ALL }] }],
  };
};

const privateRemoveGrant = (index: number): void => {
  model.value = {
    ...model.value,
    grants: model.value.grants.filter((_, itemIndex) => itemIndex !== index),
  };
};

const privateAddDelta = (): void => {
  model.value = {
    ...model.value,
    deltas: [
      ...model.value.deltas,
      { actionId: "", operation: RoleDeltaOperation.ADD, scopes: [{ kind: ScopeKind.ALL }] },
    ],
  };
};

const privateRemoveDelta = (index: number): void => {
  model.value = {
    ...model.value,
    deltas: model.value.deltas.filter((_, itemIndex) => itemIndex !== index),
  };
};

const privateAddParameter = (): void => {
  model.value = {
    ...model.value,
    parameterDefinitions: [
      ...model.value.parameterDefinitions,
      { key: "", kind: ScopeBindingKind.DEPARTMENTS },
    ],
  };
};

const privateRemoveParameter = (index: number): void => {
  model.value = {
    ...model.value,
    parameterDefinitions: model.value.parameterDefinitions.filter((_, itemIndex) => itemIndex !== index),
  };
};
</script>
