<template>
  <in-menu>
    <template v-if="sidebarTop" #sidebar-top>
      <component :is="sidebarTop" />
    </template>
    <template v-if="sidebarBottom" #sidebar-bottom>
      <component :is="sidebarBottom" />
    </template>
  </in-menu>
</template>
<script lang="ts" setup>
import InMenu from "@/layouts/widgets/InMenu.vue";
import { useAdminShell } from "../useAdminShell";

defineOptions({
  name: "DefaultAdminNavigation",
});

const { shellSlots } = useAdminShell();
const sidebarTop = computed(() => shellSlots.value["sidebar-top"]);
const sidebarBottom = computed(() => shellSlots.value["sidebar-bottom"]);
</script>
