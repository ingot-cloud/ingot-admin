<template>
  <span v-if="department" class="organization-picker-avatar" aria-hidden="true">
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.7"
    >
      <circle cx="12" cy="4" r="2.5" />
      <circle cx="5" cy="19" r="2.5" />
      <circle cx="19" cy="19" r="2.5" />
      <path d="M12 6.5V11M5 16.5V11H19V16.5" />
    </svg>
  </span>
  <in-avatar
    class="organization-picker-member-avatar"
    v-else
    :src="src"
    :name="name"
    :show-name="false"
    :size="32"
    :color="color"
  />
</template>
<script setup lang="ts">
import { computed } from "vue";
const props = defineProps<{ name?: string; src?: string; department?: boolean }>();
// 无照片时用稳定姓名色，候选与已选共用同一占位图。
const color = computed(() => {
  const seed = Array.from(props.name || "").reduce(
    (value, char) => value + (char.codePointAt(0) || 0),
    0,
  );
  const tones = [
    "var(--in-color-primary)",
    "hsl(from var(--in-color-primary) calc(h + 70) s 65%)",
    "hsl(from var(--in-color-primary) calc(h + 35) s 65%)",
    "hsl(from var(--in-color-primary) calc(h - 30) s 55%)",
  ];
  return `linear-gradient(145deg, ${tones[seed % tones.length]}, color-mix(in srgb, ${tones[seed % tones.length]} 65%, var(--in-color-primary)))`;
});
</script>
<style scoped>
.organization-picker-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--in-color-primary);
  color: white;
}
.organization-picker-member-avatar {
  --in-text-color-inverse: white;
}
</style>
