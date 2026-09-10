<template>
  <ul v-if="entries.length" class="field-errors">
    <li v-for="item in entries" :key="item.path">
      <code>{{ item.path }}</code>：{{ item.message }}
    </li>
  </ul>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{ fields?: Record<string, string> }>();

const entries = computed(() =>
  Object.entries(props.fields ?? {}).map(([path, message]) => ({ path, message })),
);
</script>

<style scoped>
.field-errors {
  margin: 0 0 16px;
  padding-left: 18px;
  color: var(--el-color-danger);
}
</style>
