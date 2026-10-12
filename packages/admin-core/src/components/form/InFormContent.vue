<template>
  <div class="in-form-content">
    <div class="in-form-content__inner">
      <slot />
    </div>
  </div>
</template>
<script setup lang="ts">
defineOptions({ name: "InFormContent" });
defineSlots<{ default?: () => unknown }>();
</script>
<style lang="postcss" scoped>
.in-form-content {
  @apply box-border w-full min-w-0 min-h-0;
  padding: var(--in-space-5);
}

.in-form-content__inner {
  @apply box-border w-full min-w-0;
  max-width: var(--in-form-content-max-width);
  margin-inline: auto;
}
</style>
