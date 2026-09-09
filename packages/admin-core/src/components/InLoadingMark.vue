<template>
  <img
    class="in-loading-mark"
    :src="loadingSrc"
    alt=""
    :width="size"
    :height="size"
    aria-hidden="true"
  />
</template>
<script lang="ts" setup>
import { useAdminTheme } from "@/theme/useAdminTheme";
import loadingDark from "../assets/loading/in-loading-dark.svg";
import loadingLight from "../assets/loading/in-loading-light.svg";

defineOptions({
  name: "InLoadingMark",
});

withDefaults(
  defineProps<{
    size?: number;
  }>(),
  {
    size: 64,
  },
);

const { isDark } = useAdminTheme();
const loadingSrc = computed(() => (isDark.value ? loadingDark : loadingLight));
</script>
<style lang="postcss" scoped>
.in-loading-mark {
  display: block;
}
</style>
