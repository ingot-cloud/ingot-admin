<template>
  <div
    class="in-container"
    :class="[`is-${variant}`, `is-${density}`]"
    :style="containerStyle"
  >
    <el-backtop v-if="showBacktop" :target="backtopTarget" :right="60" :bottom="60">
      <div flex items-center justify-center>
        <i-material-symbols:vertical-align-top-rounded />
      </div>
    </el-backtop>
    <div h-full w-full min-w-0 ref="ContentRef">
      <slot />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { InDensity, InSurfaceVariant } from "../types";

defineOptions({
  name: "InContainer",
});

const props = withDefaults(
  defineProps<{
    showBacktop?: boolean;
    padding?: string;
    radius?: string;
    background?: string;
    borderColor?: string;
    borderWidth?: string;
    variant?: InSurfaceVariant;
    density?: InDensity;
    backtopTarget?: string;
  }>(),
  {
    showBacktop: true,
    padding: "var(--in-section-padding)",
    variant: "plain",
    density: "default",
    backtopTarget: ".in-page-frame__body.is-page",
  },
);

const containerStyle = computed(() => {
  const style: Record<string, string> = {
    padding: props.padding,
  };
  if (props.radius) {
    style["--in-container-radius"] = props.radius;
  }
  if (props.background) {
    style["--in-container-bg"] = props.background;
  }
  if (props.borderColor) {
    style["--in-container-border-color"] = props.borderColor;
  }
  if (props.borderWidth) {
    style["--in-container-border-width"] = props.borderWidth;
  } else if (props.borderColor) {
    style["--in-container-border-width"] = "1px";
  }
  return style;
});

const ContentRef = ref<HTMLElement>();

defineExpose({
  getContentSize() {
    const el = ContentRef.value;
    if (!el) {
      return { height: "0px", width: "0px" };
    }
    return {
      height: getComputedStyle(el).height,
      width: getComputedStyle(el).width,
    };
  },
});
</script>

<style lang="postcss" scoped>
.in-container {
  @apply w-full box-border min-w-0;
  background: var(--in-container-bg);
  border-radius: var(--in-container-radius);
  border: var(--in-container-border-width) solid var(--in-container-border-color);
  box-shadow: none;
}

.in-container.is-plain {
  --in-container-bg: transparent;
  --in-container-border-width: 0px;
}

.in-container.is-bordered {
  --in-container-border-width: 1px;
}

.in-container.is-compact {
  --in-section-padding: var(--in-space-3);
}

.in-container.is-default {
  min-height: 100%;
}
</style>
