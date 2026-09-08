<template>
  <component :is="shellComponent">
    <template #header>
      <component :is="headerPart" />
    </template>
    <template #navigation>
      <component :is="navigationPart" />
    </template>
    <template v-if="showTabs" #tabs>
      <component :is="tabsPart" />
    </template>
    <template v-if="showBreadcrumb" #breadcrumb>
      <component :is="breadcrumbPart" />
    </template>
    <template #content>
      <in-admin-theme-content />
    </template>
    <template v-if="showCopyright" #footer>
      <component :is="footerPart" />
    </template>
  </component>
</template>
<script lang="ts" setup>
import InTabs from "@/components/InTabs.vue";
import InBreadcrumb from "@/layouts/widgets/breadcrumb/InBreadcrumb.vue";
import InCopyright from "@/layouts/widgets/InCopyright.vue";
import { getAdminResolvedTheme } from "./applyTheme";
import DefaultAdminShell from "./DefaultAdminShell.vue";
import InAdminThemeContent from "./InAdminThemeContent.vue";
import DefaultHeader from "./parts/DefaultHeader.vue";
import DefaultNavigation from "./parts/DefaultNavigation.vue";
import { resolveAdminTheme } from "./resolveTheme";
import { adminResolvedThemeKey } from "./useAdminTheme";
import { createAdminShell, provideAdminShell } from "./useAdminShell";

defineOptions({
  name: "InAdminThemeLayout",
});

const theme = inject(adminResolvedThemeKey, null) ?? getAdminResolvedTheme() ?? resolveAdminTheme();
const shell = createAdminShell();
provideAdminShell(shell);

const { showTabs, showBreadcrumb, showCopyright } = shell;

const shellComponent = computed(() => theme.shell ?? DefaultAdminShell);
const headerPart = computed(() => theme.parts?.header ?? DefaultHeader);
const navigationPart = computed(() => theme.parts?.navigation ?? DefaultNavigation);
const tabsPart = computed(() => theme.parts?.tabs ?? InTabs);
const breadcrumbPart = computed(() => theme.parts?.breadcrumb ?? InBreadcrumb);
const footerPart = computed(() => theme.parts?.footer ?? InCopyright);

const privateOnKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    shell.closeOverlay();
  }
};

onMounted(() => {
  window.addEventListener("keydown", privateOnKeydown);
});
onBeforeUnmount(() => {
  window.removeEventListener("keydown", privateOnKeydown);
});
</script>
