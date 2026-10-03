<template>
  <biz-iam-wizard-nav :steps="steps" :current="current" />
</template>

<script setup lang="ts">
import { BizIamWizardNav } from "@ingot/admin-common";

defineOptions({ name: "WizardNav" });

defineProps<{
  steps: ReadonlyArray<{ title: string; description: string }>;
  current: number;
}>();
</script>
