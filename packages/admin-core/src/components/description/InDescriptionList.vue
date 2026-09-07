<template>
  <div class="in-description-list">
    <slot />
  </div>
</template>
<script lang="ts" setup>
defineOptions({
  name: "InDescriptionList",
});
</script>
<style lang="postcss" scoped>
.in-description-list {
  display: flex;
  flex-direction: column;
  gap: var(--in-space-5);
}
</style>
