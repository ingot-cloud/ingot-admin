<template>
  <div class="login-failure-panel">
    <in-form-content class="login-failure-panel__content">
      <div ref="selectorRoot" class="login-failure-panel__selector">
        <span class="login-failure-panel__label">防护维度</span>
        <el-segmented
          :key="selectorRevision"
          :model-value="activeDimension"
          :options="dimensionOptions"
          :disabled="dimensionSwitchDisabled"
          aria-label="防护维度"
          class="login-failure-panel__segmented"
          @update:model-value="privateOnDimensionChange"
        />
      </div>
      <p class="login-failure-panel__description">各维度策略分别生效，可同时启用。</p>

      <in-loading :loading="loading || saving">
        <template v-for="item in dimensionOptions" :key="item.value">
          <LoginFailureDimensionPanel
            v-if="visitedDimensions[item.value]"
            v-show="activeDimension === item.value"
            ref="dimensionPanelRefs"
            :dimension="item.value"
            :config="policyMap[item.value]"
            :saving="saving"
            :save-policy="savePolicy"
          />
        </template>
      </in-loading>
    </in-form-content>
  </div>
</template>

<script setup lang="ts">
import { LoginFailureDimensionEnum, LoginFailureDimensionMetaList } from "@/models/enums";
import { useLoginFailurePolicy } from "../use/useLoginFailurePolicy";
import LoginFailureDimensionPanel from "./LoginFailureDimensionPanel.vue";

const dimensionOptions = LoginFailureDimensionMetaList;
const activeDimension = ref(LoginFailureDimensionEnum.IP);
const dimensionPanelRefs = ref<Array<InstanceType<typeof LoginFailureDimensionPanel>>>([]);
const switchingDimension = ref(false);
const selectorRoot = ref<HTMLElement>();
const selectorRevision = ref(0);

const visitedDimensions = reactive<Record<string, boolean>>({});
watch(
  activeDimension,
  (dimension) => {
    visitedDimensions[dimension] = true;
  },
  { immediate: true },
);

const { loading, saving, policyMap, loadAll, savePolicy } = useLoginFailurePolicy(activeDimension);
const dimensionSwitchDisabled = computed(
  () =>
    saving.value ||
    switchingDimension.value ||
    dimensionPanelRefs.value.some((panel) => panel.confirming),
);

const privateOnDimensionChange = async (value: string | number | boolean): Promise<void> => {
  const target = dimensionOptions.find((item) => item.value === value);
  if (!target || target.value === activeDimension.value || dimensionSwitchDisabled.value) return;
  switchingDimension.value = true;
  let restoreFocus = false;
  try {
    const currentPanel = dimensionPanelRefs.value.find(
      (panel) => panel.dimension === activeDimension.value,
    );
    if (currentPanel && !(await currentPanel.prepareDimensionChange())) {
      // 异步取消时恢复原生单选状态，避免只恢复高亮而失去勾选。
      selectorRevision.value += 1;
      restoreFocus = true;
      return;
    }
    activeDimension.value = target.value;
  } finally {
    switchingDimension.value = false;
    if (restoreFocus) {
      await nextTick();
      selectorRoot.value
        ?.querySelector<HTMLInputElement>("input:checked")
        ?.focus({ preventScroll: true });
    }
  }
};

defineExpose({
  refresh: loadAll,
});
</script>

<style lang="postcss" scoped>
.login-failure-panel {
  @apply flex flex-col min-h-0;

  & .login-failure-panel__content {
    @apply flex-1 min-w-0;
  }

  & .login-failure-panel__selector {
    @apply flex flex-wrap items-center;
    gap: var(--in-space-3);
  }

  & .login-failure-panel__label {
    @apply flex-none text-[var(--in-text-color)];
  }

  & .login-failure-panel__segmented {
    @apply min-w-0 max-w-full;
    --el-segmented-color: var(--in-text-color-secondary);
    --el-segmented-bg-color: var(--in-bg-color-muted);
    --el-segmented-item-selected-color: var(--in-color-primary);
    --el-segmented-item-selected-bg-color: var(--in-bg-color-surface);
    --el-segmented-item-selected-disabled-bg-color: var(--in-bg-color-surface);
    --el-segmented-item-hover-color: var(--in-text-color);
    --el-segmented-item-hover-bg-color: var(--in-bg-color-hover);
    --el-segmented-item-active-bg-color: var(--in-bg-color-active);
    --el-segmented-item-disabled-color: var(--in-text-color-disabled);
  }

  & .login-failure-panel__description {
    @apply text-[var(--in-text-color-secondary)];
    font-size: var(--in-font-size-caption);
    margin-block: var(--in-space-2) var(--in-space-6);
  }
}
</style>
