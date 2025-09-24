<template>
  <span class="in-title">{{ title }}</span>
</template>
<script setup lang="ts">
defineProps({
  title: {
    type: String,
    required: true,
  },
});
</script>
<style lang="postcss" scoped>
.in-title {
  color: var(--in-common-title-color);
  font-weight: var(--in-common-title-font-weight);
  font-size: var(--in-common-title-font-size);
}
</style>
