<template>
  <div flex gap-4 flex-row flex-wrap>
    <in-icon
      v-for="name in icons"
      :key="name"
      :name="name"
      class="w-[var(--in-menu-icon-size)] h-[var(--in-menu-icon-size)]"
      @click="privateOnItemClick(name)"
    />
  </div>
</template>
<script lang="ts" setup>
const emit = defineEmits<{ select: [item: string] }>();
const icons = useIconsCollection();
const privateOnItemClick = (item: string) => {
  emit("select", item);
};
</script>
