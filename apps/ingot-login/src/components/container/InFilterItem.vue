<template>
  <div flex flex-col>
    <div flex flex-row justify-between>
      <div flex flex-row flex-wrap gap-12px flex-1>
        <slot />
      </div>
      <div v-if="slots.rightActions" flex flex-row flex-wrap>
        <slot name="rightActions" />
      </div>
    </div>
    <div m-t-5px self-end flex flex-row flex-wrap v-if="slots.bottomActions">
      <slot name="bottomActions" />
    </div>
  </div>
</template>
<script lang="ts" setup>
const slots = useSlots();
</script>
