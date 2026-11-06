<template>
  <el-dialog
    :model-value="Boolean(asset)"
    title="图片预览"
    class="help-image-dialog"
    fullscreen
    append-to-body
    :show-close="false"
    :close-on-click-modal="true"
    :close-on-press-escape="true"
    @close="$emit('close')"
  >
    <template #header>
      <div class="help-preview-toolbar">
        <span>{{ index + 1 }} / {{ assets.length }}</span>
        <span class="help-preview-caption">{{ asset?.caption }}</span>
        <button type="button" aria-label="缩小图片" @click="privateZoom(-25)">−</button>
        <span class="help-preview-scale">{{ scale }}%</span>
        <button type="button" aria-label="放大图片" @click="privateZoom(25)">＋</button>
        <button type="button" @click="privateFit">适应窗口</button>
        <button type="button" @click="scale = 100">1:1</button>
        <button type="button" aria-label="关闭图片预览" @click="$emit('close')">×</button>
      </div>
    </template>
    <div
      ref="viewport"
      class="help-preview-viewport"
      @wheel.prevent="privateWheel"
      @click.self="$emit('close')"
      @pointerdown="privatePointerDown"
      @pointermove="privatePointerMove"
      @pointerup="drag = undefined"
      @pointercancel="drag = undefined"
    >
      <img
        v-if="url && asset"
        v-show="loaded"
        :src="url"
        :alt="asset.alt"
        draggable="false"
        :style="{ width: `${(asset.width * scale) / 100}px`, maxWidth: 'none' }"
        @load="privateImageLoaded"
        @error="privateImageError"
      />
      <div v-if="!loaded" class="help-preview-loading" role="status">
        <p>{{ failed ? "原图加载失败" : "正在加载原图…" }}</p>
        <button v-if="failed" type="button" @click="privateLoad">重试</button>
      </div>
    </div>
    <button
      v-if="assets.length > 1"
      type="button"
      class="help-preview-previous"
      aria-label="上一张图片"
      :disabled="index === 0"
      @click="$emit('select', index - 1)"
    >
      ‹
    </button>
    <button
      v-if="assets.length > 1"
      type="button"
      class="help-preview-next"
      aria-label="下一张图片"
      :disabled="index === assets.length - 1"
      @click="$emit('select', index + 1)"
    >
      ›
    </button>
  </el-dialog>
</template>
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import type { HelpArticleAsset } from "../../../models/help";
import { useHelpRuntime } from "../../../runtime";
const props = defineProps<{ assets: HelpArticleAsset[]; index: number; version: string }>();
const emit = defineEmits<{ close: []; select: [index: number] }>();
const runtime = useHelpRuntime();
const asset = computed(() => props.assets[props.index]);
const url = ref<string>(),
  loaded = ref(false),
  scale = ref(100),
  failed = ref(false),
  viewport = ref<HTMLElement>();
const drag = ref<{ x: number; y: number; left: number; top: number }>();
let ticket = 0;
const privateFit = (): void => {
  if (!asset.value) return;
  const width = viewport.value?.clientWidth ?? window.innerWidth;
  const height = viewport.value?.clientHeight ?? window.innerHeight - 80;
  scale.value = Math.max(
    1,
    Math.floor(
      Math.min((width - 64) / asset.value.width, (height - 64) / asset.value.height, 1) * 100,
    ),
  );
};
const privateLoad = async (): Promise<void> => {
  const image = asset.value,
    current = ++ticket;
  url.value = undefined;
  failed.value = false;
  loaded.value = false;
  if (!image) return;
  await nextTick();
  privateFit();
  try {
    const value = await runtime.image(image.id, props.version);
    if (current === ticket) url.value = value;
  } catch (error) {
    if (current === ticket && !(error instanceof DOMException && error.name === "AbortError"))
      failed.value = true;
  }
};
const privateImageError = (): void => {
  loaded.value = false;
  failed.value = true;
  url.value = undefined;
};
const privateImageLoaded = (): void => {
  loaded.value = true;
  privateFit();
};
watch(() => [props.index, props.version], privateLoad, { immediate: true });
const privateZoom = (amount: number): void => {
  scale.value = Math.max(50, Math.min(400, scale.value + amount));
};
const privateWheel = (event: WheelEvent): void => {
  privateZoom(event.deltaY < 0 ? 25 : -25);
};
const privateKey = (event: KeyboardEvent): void => {
  if (event.key === "ArrowLeft" && props.index > 0) {
    event.preventDefault();
    emit("select", props.index - 1);
  }
  if (event.key === "ArrowRight" && props.index + 1 < props.assets.length) {
    event.preventDefault();
    emit("select", props.index + 1);
  }
};
window.addEventListener("keydown", privateKey);
onBeforeUnmount(() => {
  ticket += 1;
  window.removeEventListener("keydown", privateKey);
  url.value = undefined;
});
const privatePointerDown = (event: PointerEvent): void => {
  if (!viewport.value || event.target === viewport.value) return;
  drag.value = {
    x: event.clientX,
    y: event.clientY,
    left: viewport.value.scrollLeft,
    top: viewport.value.scrollTop,
  };
  viewport.value.setPointerCapture(event.pointerId);
};
const privatePointerMove = (event: PointerEvent): void => {
  if (!drag.value || !viewport.value) return;
  viewport.value.scrollLeft = drag.value.left - event.clientX + drag.value.x;
  viewport.value.scrollTop = drag.value.top - event.clientY + drag.value.y;
};
</script>
