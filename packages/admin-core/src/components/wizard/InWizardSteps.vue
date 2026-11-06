<template>
  <nav class="in-wizard-steps" aria-label="步骤">
    <ol>
      <li
        v-for="(item, index) in steps"
        :key="item.title"
        :class="{
          'is-active': index === current,
          'is-complete': statuses ? statuses[index] === 'valid' : index < current,
          'is-invalid': statuses?.[index] === 'invalid',
        }"
        :aria-current="index === current ? 'step' : undefined"
      >
        <component
          :is="interactive ? 'button' : 'div'"
          class="in-wizard-steps__item"
          :type="interactive ? 'button' : undefined"
          @click="interactive && emit('change', index)"
        >
          <span class="in-wizard-steps__marker" aria-hidden="true">
            <svg
              v-if="statuses ? statuses[index] === 'valid' : index < current"
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="m3.5 8 3 3 6-6"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <template v-else>{{ statuses?.[index] === "invalid" ? "!" : index + 1 }}</template>
          </span>
          <span class="in-wizard-steps__text">
            <span class="in-wizard-steps__title">{{ item.title }}</span>
            <span v-if="item.description" class="in-wizard-steps__description">{{
              item.description
            }}</span>
          </span>
        </component>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
import type { InWizardStep, InWizardStepStatus } from "./types";

defineProps<{
  steps: readonly InWizardStep[];
  current: number;
  interactive?: boolean;
  statuses?: readonly InWizardStepStatus[];
}>();
const emit = defineEmits<{ change: [index: number] }>();
</script>

<style lang="postcss">
.in-wizard-steps {
  box-sizing: border-box;
  width: min(var(--in-wizard-panel-width), 100% - 2 * var(--in-wizard-gutter));
  max-height: 32%;
  margin-inline: auto;
  padding-block: var(--in-space-3);
  overflow: auto;

  & ol {
    display: flex;
    flex-wrap: wrap;
    gap: var(--in-space-2) var(--in-space-4);
    margin: 0;
    padding: 2px;
    list-style: none;
  }

  & li {
    min-width: 0;
    max-width: 100%;
  }

  & .is-active,
  & .is-complete {
    --in-wizard-step-border: var(--in-color-primary);
    --in-wizard-step-ink: var(--in-color-primary);
  }

  & .is-active {
    --in-wizard-step-fill: var(--in-color-primary);
    --in-wizard-step-ink: var(--in-text-color-inverse);
    color: var(--in-text-color);
    font-weight: var(--in-font-weight-section-title);
  }

  & .is-invalid {
    --in-wizard-step-fill: transparent;
    --in-wizard-step-border: var(--in-color-danger);
    --in-wizard-step-ink: var(--in-color-danger);
  }
}

.in-wizard-steps__item {
  display: flex;
  align-items: flex-start;
  gap: var(--in-space-2);
  max-width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: start;
}

button.in-wizard-steps__item {
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid var(--in-focus-ring-color);
    outline-offset: 1px;
    border-radius: var(--in-radius-control);
  }
}

.in-wizard-steps__marker {
  box-sizing: border-box;
  display: grid;
  flex: none;
  place-items: center;
  width: 24px;
  height: 24px;
  border: 1px solid var(--in-wizard-step-border, var(--in-border-color));
  border-radius: 50%;
  background: var(--in-wizard-step-fill, transparent);
  color: var(--in-wizard-step-ink, var(--in-text-color-secondary));
  font-size: 12px;
}

.in-wizard-steps__text {
  min-width: 0;
  padding-top: 2px;
  overflow-wrap: anywhere;
}

.in-wizard-steps__description {
  display: none;
  color: var(--in-text-color-secondary);
  font-size: 12px;
  font-weight: normal;
}

@container in-wizard (min-width: 1120px) {
  .in-wizard-steps {
    grid-column: 1;
    grid-row: 1;
    width: 100%;
    max-height: none;
    margin: 0;
    padding: 44px var(--in-space-3) var(--in-space-4) calc(var(--in-space-8) + var(--in-space-2));

    & ol {
      flex-direction: column;
      flex-wrap: nowrap;
      gap: 0;
    }

    & li {
      position: relative;
    }

    & li:not(:last-child) {
      padding-bottom: 30px;
    }

    & li:not(:last-child)::after {
      position: absolute;
      bottom: 10px;
      left: 11px;
      width: 1px;
      height: 36px;
      background: var(--in-border-color);
      content: "";
      pointer-events: none;
    }

    & li.is-complete:not(:last-child)::after {
      background: var(--in-color-primary);
    }
  }

  .in-wizard-steps__item {
    gap: var(--in-space-3);
  }

  .in-wizard-steps__description {
    display: block;
    margin-top: var(--in-space-1);
  }
}
</style>
