<template>
  <div v-html="value"></div>
</template>
<script setup lang="ts">
import type { CustomOptions, Options } from "./exported";
import type { PropType } from "vue";
import { QrcodeType, encodeData, rendererLine, rendererRound } from "./exported";
import { copyParamsWithoutKeys, copyParamsWithKeys } from "@/utils/object";

const props = defineProps({
  options: {
    type: Object as PropType<CustomOptions>,
    required: true,
  },
});

const value = ref("");

const optionsKeys = ["text", "width", "height", "correctLevel", "isSpace"];

watch(
  () => props.options,
  (customOptions) => {
    if (!customOptions.size || !customOptions.opacity || !customOptions.text) {
      return;
    }
    const options = {};
    const targetOptions = {};
    const raw = toRaw(customOptions);
    copyParamsWithKeys(options, raw, optionsKeys, true);
    copyParamsWithoutKeys(
      targetOptions,
      raw,
      [...optionsKeys, "type", "lineOptionsType", "roundOptionsType"],
      true,
    );
    switch (customOptions.type) {
      case QrcodeType.Line:
        value.value = rendererLine(encodeData(options as Options), {
          type: raw.lineOptionsType,
          ...targetOptions,
        });
        break;
      case QrcodeType.Round:
        value.value = rendererRound(encodeData(options as Options), {
          type: raw.roundOptionsType,
          ...targetOptions,
        });
        break;
    }
  },
  {
    immediate: true,
    deep: true,
  },
);

defineExpose({
  getValue() {
    return value.value;
  },
});
</script>
