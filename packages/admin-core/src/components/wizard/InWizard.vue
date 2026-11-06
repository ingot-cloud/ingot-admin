<template>
  <component
    :is="shell"
    v-model="visible"
    v-bind="{ ...shellProps, ...$attrs }"
    :class="shellClass"
  >
    <div v-if="enabled" class="in-wizard__frame">
      <in-wizard-steps
        v-if="steps?.length"
        :steps="steps"
        :current="current"
        :interactive="interactive"
        :statuses="statuses"
        @change="emit('change', $event)"
      />
      <section class="in-wizard__panel">
        <div v-if="currentStep" class="in-wizard__heading">
          <h2>{{ currentStep.title }}</h2>
          <slot name="heading-extra" />
        </div>
        <div class="in-wizard__body" :class="{ 'in-wizard__body--contained': contained }">
          <slot />
        </div>
      </section>
    </div>
    <slot v-else />
    <template v-if="$slots.footer" #footer>
      <div v-if="enabled" class="in-wizard__actions">
        <slot name="footer" />
      </div>
      <slot v-else name="footer" />
    </template>
  </component>
</template>

<script setup lang="ts">
import InDialog from "../InDialog.vue";
import InDrawer from "../drawer/InDrawer.vue";
import InWizardSteps from "./InWizardSteps.vue";
import type { InWizardStep, InWizardStepStatus } from "./types";

defineOptions({ name: "InWizard", inheritAttrs: false });

const visible = defineModel<boolean>({ default: false });
const props = withDefaults(
  defineProps<{
    presentation?: "fullscreen" | "drawer" | "dialog";
    width?: string;
    enabled?: boolean;
    steps?: readonly InWizardStep[];
    current?: number;
    interactive?: boolean;
    statuses?: readonly InWizardStepStatus[];
    contained?: boolean;
  }>(),
  { presentation: "fullscreen", enabled: true, current: 0 },
);
const emit = defineEmits<{ change: [index: number] }>();
const shell = computed(() => (props.presentation === "dialog" ? InDialog : InDrawer));
const shellClass = computed(() => ({
  "in-wizard-shell": props.enabled,
  "in-wizard-shell--fullscreen": props.enabled && props.presentation === "fullscreen",
}));
const shellProps = computed(() =>
  props.presentation === "dialog"
    ? { layout: "pinned" as const, width: props.width && `min(${props.width}, calc(100vw - 32px))` }
    : {
        layout: "pinned" as const,
        padding: "0",
        size: props.width ? `min(${props.width}, 100vw)` : "100%",
        closePosition:
          props.presentation === "fullscreen" && props.enabled
            ? ("start" as const)
            : ("end" as const),
      },
);
const currentStep = computed(() => props.steps?.[props.current]);
</script>

<style lang="postcss">
.in-wizard-shell {
  --in-wizard-panel-width: 680px;
  --in-wizard-gutter: var(--in-space-4);
  container: in-wizard / inline-size;

  &.in-dialog {
    padding: 0;
  }

  &.in-dialog.in-dialog--pinned > .el-dialog__body,
  &.in-drawer.in-drawer--pinned > .el-drawer__body > .in-drawer__body {
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
  }

  &.in-dialog.in-dialog--pinned > .el-dialog__body {
    padding: 0;
  }

  &.in-drawer.in-drawer--pinned > .el-drawer__body > .in-drawer__body > .in-loading {
    flex: 1 1 auto;
  }

  &.in-dialog > .el-dialog__footer,
  &.in-drawer > .el-drawer__footer {
    padding: 0;
  }
}

.in-wizard-shell--fullscreen.in-drawer {
  & > .el-drawer__header {
    padding: var(--in-space-5);
  }

  & .in-drawer__close-start {
    padding: 3px 4px;
  }

  & .in-drawer__start-title {
    font-weight: var(--in-font-weight-section-title);
  }
}

.in-wizard__frame {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  background: var(--in-bg-color-canvas);
}

.in-wizard__columns {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.5fr) minmax(0, 1.15fr);
  grid-template-rows: minmax(0, 1fr);
  height: 100%;
  min-height: 0;

  & > * {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    padding-inline: var(--in-space-3);
  }

  & > :first-child {
    padding-inline-start: 0;
  }

  & > :last-child {
    padding-inline-end: 0;
  }

  & > * + * {
    border-inline-start: 1px solid var(--in-border-color);
  }
}

.in-wizard__column-list {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

@container in-wizard-content (max-width: 520px) {
  .in-wizard__columns {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: none;
    grid-auto-rows: max-content;
    align-content: start;
    gap: var(--in-space-4);
    overflow: auto;

    & > * {
      padding-inline: 0;
    }

    & > * + * {
      border-inline-start: 0;
      border-block-start: 1px solid var(--in-border-color);
      padding-block-start: var(--in-space-4);
    }
  }

  .in-wizard__column-list {
    overflow: visible;
  }
}

.in-wizard__panel,
.in-wizard__actions {
  box-sizing: border-box;
  width: min(var(--in-wizard-panel-width), 100% - 2 * var(--in-wizard-gutter));
  margin-inline: auto;
}

.in-wizard__panel {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  padding: var(--in-space-4);
  background: var(--in-bg-color-surface);
  overflow-wrap: anywhere;
}

.in-wizard__heading {
  display: flex;
  flex: none;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--in-space-3);
  margin-bottom: var(--in-space-6);

  & h2 {
    margin: 0;
    font-size: 20px;
    font-weight: var(--in-font-weight-section-title);
    line-height: 28px;
  }
}

.in-wizard__body {
  container: in-wizard-content / inline-size;
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  overflow: auto;
}

.in-wizard__body--contained {
  overflow: hidden;
}

.in-wizard__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  min-height: 63px;
  gap: var(--in-space-3);
  padding-block: var(--in-space-2);

  & > .el-button {
    min-width: min(80px, 100%);
    max-width: 100%;
    min-height: 32px;
    height: auto;
    margin: 0;
    white-space: normal;
    overflow-wrap: anywhere;
  }

  & > .el-button + .el-button {
    margin-inline-start: 0;
  }

  & > .el-button > span {
    min-width: 0;
  }
}

@container in-wizard (min-width: 1120px) {
  .in-wizard__frame {
    display: grid;
    grid-template-columns: minmax(0, 1fr) var(--in-wizard-panel-width) minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr);
  }

  .in-wizard__panel {
    grid-column: 2;
    grid-row: 1;
    width: 100%;
    padding: var(--in-space-8);
  }

  .in-wizard__actions {
    padding-inline-end: 5px;
  }
}
</style>
