<template>
  <in-upload :api="api" />
</template>

<script setup lang="ts">
import type { UploadAPIFn } from "./types";

defineProps<{ api: UploadAPIFn }>();
</script>
