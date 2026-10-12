<template>
  <div class="flex flex-col gap-2 min-w-0">
    <div v-for="(item, index) in patterns" :key="index" class="flex gap-2 min-w-0 items-start">
      <span class="flex-none">{{ item.method === "*" ? "全部方法" : item.method }}</span>
      <span class="min-w-0 break-all">{{ item.path || "—" }}</span>
    </div>
    <span v-if="!patterns?.length">—</span>
  </div>
</template>
<script setup lang="ts">
import type { GatewayEndpointPattern } from "@/models";
defineProps<{ patterns?: GatewayEndpointPattern[] }>();
</script>
