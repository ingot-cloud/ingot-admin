<template>
  <div class="flex flex-col gap-8px">
    <div v-for="(item, index) in model" :key="index" class="flex flex-wrap items-center gap-8px">
      <el-select v-model="item.kind" placeholder="请选择范围" class="w-180px" @change="privateOnChange">
        <el-option
          v-for="option in kindOptions"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </el-select>
      <el-input
        v-if="needsParameter(item.kind)"
        v-model="item.parameterKey"
        placeholder="请输入参数键"
        class="w-160px"
        @change="privateOnChange"
      />
      <el-checkbox
        v-if="allowsDescendants(item.kind)"
        v-model="item.includeDescendants"
        @change="privateOnChange"
      >
        含下级
      </el-checkbox>
      <el-button text type="danger" @click="privateRemove(index)">删除</el-button>
    </div>
    <el-button text type="primary" @click="privateAdd">添加范围</el-button>
  </div>
</template>

<script setup lang="ts">
import { ScopeKind, useScopeKindEnum, type ScopeExpression } from "../models/iam";

defineOptions({ name: "BizIamScopeEditor" });

const model = defineModel<ScopeExpression[]>({ default: () => [] });
const kindEnum = useScopeKindEnum();
const kindOptions = kindEnum.getOptions();

const needsParameter = (kind: ScopeKind): boolean => kind === ScopeKind.OBJECT_SET;
const allowsDescendants = (kind: ScopeKind): boolean =>
  kind === ScopeKind.MEMBER_DEPARTMENTS || kind === ScopeKind.MANAGED_DEPARTMENTS;

const privateOnChange = (): void => {
  model.value = [...model.value];
};

const privateAdd = (): void => {
  model.value = [...model.value, { kind: ScopeKind.SELF }];
};

const privateRemove = (index: number): void => {
  model.value = model.value.filter((_, itemIndex) => itemIndex !== index);
};
</script>
