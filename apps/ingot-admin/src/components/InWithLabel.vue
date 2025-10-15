<template>
  <div flex flex-row justify-start items-center>
    <div class="in-with-label">{{ title }}</div>
    <div flex-1>
      <slot />
    </div>
  </div>
</template>
<script lang="ts" setup>
defineProps<{
  title: String;
}>();
</script>
<style lang="postcss">
.in-with-label {
  @apply color-[var(--in-text-color-primary)] m-r-5px;
  font-size: 14px;
}
</style>
