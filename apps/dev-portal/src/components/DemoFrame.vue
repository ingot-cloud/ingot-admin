<template>
  <ClientOnly>
    <iframe
      v-if="src"
      ref="frameRef"
      class="demo-frame"
      :src="src"
      :title="`演示 ${demoId}`"
      loading="lazy"
      @load="privateSync"
    />
  </ClientOnly>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useData, withBase } from "vitepress";

const props = defineProps<{ demoId: string }>();
const { isDark } = useData();
const frameRef = ref<HTMLIFrameElement | null>(null);

const src = computed(() => withBase(`/demos/index.html#/${props.demoId}`));

const privateSync = () => {
  const target = frameRef.value?.contentWindow;
  if (!target) {
    return;
  }
  target.postMessage({ type: "ingot-demo-theme", dark: isDark.value }, window.location.origin);
};

const privateOnMessage = (event: MessageEvent) => {
  if (event.origin !== window.location.origin) {
    return;
  }
  if (event.data?.type === "ingot-demo-resize" && typeof event.data.height === "number" && frameRef.value) {
    frameRef.value.style.height = `${Math.min(Math.max(event.data.height, 160), 720)}px`;
  }
};

watch(isDark, () => privateSync());

onMounted(() => {
  window.addEventListener("message", privateOnMessage);
});

onBeforeUnmount(() => {
  window.removeEventListener("message", privateOnMessage);
});
</script>

<style scoped>
.demo-frame {
  width: 100%;
  min-height: 160px;
  max-height: 720px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg);
}
</style>
