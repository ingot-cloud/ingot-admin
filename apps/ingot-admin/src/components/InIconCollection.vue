<template>
  <div flex gap-4 flex-row flex-wrap>
    <in-icon
      v-for="name in icons"
      :key="name"
      :name="name"
      class="w-[var(--in-menu-icon-size)] h-[var(--in-menu-icon-size)]"
      @click="onItemClick(name)"
    />
  </div>
</template>
<script lang="ts" setup>
import { defineEmits } from "vue";

const emits = defineEmits(["onItemClick"]);
const icons = useIconsCollection();
const onItemClick = (item: string) => {
  emits("onItemClick", item);
};
</script>
