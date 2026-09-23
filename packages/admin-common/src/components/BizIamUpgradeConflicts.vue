<template>
  <div class="flex flex-col gap-12px">
    <el-alert
      v-if="conflicts.length"
      type="warning"
      :closable="false"
      title="升级存在冲突，必须逐项选择处置，不能使用默认值提交"
    />
    <div v-for="item in conflicts" :key="item.key" class="flex flex-col gap-8px">
      <div>{{ item.message }}</div>
      <el-select
        :model-value="resolutionOf(item.key)"
        placeholder="选择处置"
        class="w-220px"
        @change="(value: UpgradeResolutionChoice) => privateChoose(item.key, value)"
      >
        <el-option
          v-for="option in choiceOptions"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </el-select>
      <biz-iam-scope-editor
        v-if="resolutionOf(item.key) === UpgradeResolutionChoice.REPLACE_SCOPE"
        :model-value="scopesOf(item.key)"
        @update:model-value="(value) => privateSetScopes(item.key, value)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import BizIamScopeEditor from "./BizIamScopeEditor.vue";
import {
  UpgradeResolutionChoice,
  useUpgradeResolutionChoiceEnum,
  type ScopeExpression,
  type UpgradeConflict,
  type UpgradeResolution,
} from "../models/iam";

defineOptions({ name: "BizIamUpgradeConflicts" });

const props = withDefaults(
  defineProps<{
    conflicts?: UpgradeConflict[];
  }>(),
  {
    conflicts: () => [],
  },
);

const resolutions = defineModel<UpgradeResolution[]>({ default: () => [] });
const choiceEnum = useUpgradeResolutionChoiceEnum();
const choiceOptions = choiceEnum.getOptions();

const resolutionOf = (key: string): UpgradeResolutionChoice | undefined =>
  resolutions.value.find((item) => item.key === key)?.choice;

const scopesOf = (key: string): ScopeExpression[] =>
  resolutions.value.find((item) => item.key === key)?.scopes ?? [];

const replaceResolution = (key: string, patch: Partial<UpgradeResolution>): void => {
  const current = resolutions.value.find((item) => item.key === key);
  const next = resolutions.value.filter((item) => item.key !== key);
  next.push({
    key,
    choice: patch.choice ?? current?.choice ?? UpgradeResolutionChoice.ACCEPT_BASE,
    scopes: "scopes" in patch ? patch.scopes : current?.scopes,
  });
  resolutions.value = next;
};

const privateChoose = (key: string, choice: UpgradeResolutionChoice): void => {
  replaceResolution(key, {
    choice,
    scopes: choice === UpgradeResolutionChoice.REPLACE_SCOPE ? scopesOf(key) : undefined,
  });
};

const privateSetScopes = (key: string, scopes: ScopeExpression[]): void => {
  replaceResolution(key, { scopes });
};
</script>
