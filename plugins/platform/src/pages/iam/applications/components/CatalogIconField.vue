<template>
  <el-input v-model="icon" class="w-full min-w-0" clearable placeholder="请输入图标名，如 ep:menu">
    <template #append>
      <div
        ref="iconButtonRef"
        v-click-outside="privateOnIconPopoverClose"
        class="w-full h-full flex items-center justify-center cursor-pointer"
      >
        <catalog-icon-preview :value="icon" />
      </div>
    </template>
  </el-input>
  <el-popover
    ref="iconPopoverRef"
    trigger="click"
    placement="bottom"
    :width="300"
    :virtual-ref="iconButtonRef"
    virtual-triggering
  >
    <in-icon-collection @select="privateOnIconSelect" />
  </el-popover>
</template>

<script setup lang="ts">
import { ClickOutside as vClickOutside } from "element-plus";
import CatalogIconPreview from "./CatalogIconPreview.vue";

defineOptions({ name: "CatalogIconField" });

const icon = defineModel<string | undefined>({ default: undefined });
const iconButtonRef = ref<HTMLElement>();
const iconPopoverRef = ref<{ popperRef?: { delayHide?: () => void } }>();

const privateOnIconSelect = (name: string): void => {
  icon.value = name;
  privateOnIconPopoverClose();
};

const privateOnIconPopoverClose = (): void => {
  iconPopoverRef.value?.popperRef?.delayHide?.();
};
</script>
