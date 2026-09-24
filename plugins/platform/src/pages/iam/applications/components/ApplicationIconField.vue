<template>
  <div class="flex flex-col gap-12px">
    <catalog-icon-field v-model="iconifyValue" />
    <div class="flex items-center gap-12px">
      <in-common-upload-avatar :dir="APP_ICON_DIR" v-model="uploadValue" />
      <span class="text-12px text-[var(--el-text-color-secondary)]">也可上传自定义 Logo</span>
      <in-button v-if="icon" type="primary" link @in-click="privateClear">清除</in-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { APP_ICON_DIR, isCatalogImageIcon } from "../catalogIcon";
import CatalogIconField from "./CatalogIconField.vue";

defineOptions({ name: "ApplicationIconField" });

const icon = defineModel<string | undefined>({ default: undefined });
const iconifyValue = computed({
  get: () => (isCatalogImageIcon(icon.value) ? undefined : icon.value),
  set: (value?: string) => {
    icon.value = value || undefined;
  },
});
const uploadValue = computed({
  get: () => (isCatalogImageIcon(icon.value) ? icon.value : "") ?? "",
  set: (value?: string) => {
    icon.value = value || undefined;
  },
});

const privateClear = (): void => {
  icon.value = undefined;
};
</script>
