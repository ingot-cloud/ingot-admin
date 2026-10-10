<template>
  <div class="flex flex-wrap items-center gap-8px text-12px">
    <in-tag :value="{ text: status.label, tag: status.tone }" size="small" effect="light" />
    <span class="text-[var(--in-text-color-secondary)]">{{ status.detail }}</span>
  </div>
</template>
<script setup lang="ts">
import type { FieldBindingManifest, FieldCapability } from "@ingot/admin-common";
import { resourceFieldBinding } from "./resourceFields";
defineOptions({ name: "ResourceFieldBinding" });
const props = defineProps<{
  field: FieldCapability;
  checkable: boolean;
  manifest?: FieldBindingManifest;
  failed?: boolean;
}>();
const status = computed(() =>
  resourceFieldBinding(props.field, props.checkable, props.manifest, props.failed),
);
</script>
