<template>
  <figure ref="figure" class="help-figure">
    <button
      type="button"
      class="help-figure-open"
      :style="{ aspectRatio: `${asset.width} / ${asset.height}` }"
      :aria-label="`放大查看：${asset.alt}`"
      :disabled="!loaded"
      @click="$emit('preview', asset.id)"
    >
      <img
        v-if="url"
        :src="url"
        :alt="asset.alt"
        :width="asset.width"
        :height="asset.height"
        @load="loaded = true"
        @error="privateImageError"
      />
      <span v-if="!loaded" class="help-figure-placeholder">{{
        failed ? "配图暂不可用" : "正在加载配图…"
      }}</span>
      <span v-if="loaded" class="help-figure-zoom"><InIcon name="ep:zoom-in" />点击查看大图</span>
    </button>
    <figcaption>{{ asset.caption }}</figcaption>
    <button v-if="failed" type="button" class="help-text-button" @click="privateLoad">
      重新加载图片
    </button>
  </figure>
</template>
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { HelpArticleAsset } from "../../../models/help";
import { useHelpRuntime } from "../../../runtime";
const props = defineProps<{ asset: HelpArticleAsset; version: string }>();
defineEmits<{ preview: [id: string] }>();
const runtime = useHelpRuntime();
const figure = ref<HTMLElement>(),
  url = ref<string>(),
  loaded = ref(false),
  failed = ref(false);
let observer: IntersectionObserver | undefined;
let disposed = false,
  ticket = 0;
const privateLoad = async (): Promise<void> => {
  const current = ++ticket;
  failed.value = false;
  loaded.value = false;
  url.value = undefined;
  try {
    const result = await runtime.image(props.asset.thumbnailAssetId, props.version);
    if (!disposed && current === ticket) url.value = result;
  } catch (error) {
    if (
      !disposed &&
      current === ticket &&
      !(error instanceof DOMException && error.name === "AbortError")
    )
      failed.value = true;
  }
};
const privateImageError = (): void => {
  loaded.value = false;
  failed.value = true;
  url.value = undefined;
};
onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer?.disconnect();
        void privateLoad();
      }
    },
    { root: document.querySelector("[data-help-scroll]"), rootMargin: "300px" },
  );
  if (figure.value) observer.observe(figure.value);
});
watch(
  () => [props.asset.id, props.version],
  () => {
    void privateLoad();
  },
);
onBeforeUnmount(() => {
  disposed = true;
  ticket += 1;
  observer?.disconnect();
  url.value = undefined;
});
</script>
