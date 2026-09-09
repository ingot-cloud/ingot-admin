<template>
  <in-app-bar :header="header">
    <template v-if="headerStart" #header-start>
      <component :is="headerStart" />
    </template>
    <template v-if="headerEnd" #header-end>
      <component :is="headerEnd" />
    </template>
  </in-app-bar>
</template>
<script lang="ts" setup>
import InAppBar from "@/layouts/widgets/InAppBar.vue";
import { useAdminShell } from "../useAdminShell";

defineOptions({
  name: "DefaultAdminHeader",
});

const { shellSlots, header } = useAdminShell();
const headerStart = computed(() => shellSlots.value["header-start"]);
const headerEnd = computed(() => shellSlots.value["header-end"]);
</script>
