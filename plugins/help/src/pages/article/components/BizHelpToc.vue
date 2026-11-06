<template>
  <nav v-if="headings.length" class="help-toc" aria-label="本篇目录">
    <div class="help-toc-label">本篇目录</div>
    <a
      v-for="heading in headings"
      :key="heading.id"
      :href="`#${heading.id}`"
      :class="{ 'is-active': active === heading.id, 'is-nested': heading.level > 2 }"
      :aria-current="active === heading.id ? 'location' : undefined"
      @click.prevent="$emit('navigate', heading.id)"
    >
      {{ heading.title }}
    </a>
  </nav>
</template>
<script setup lang="ts">
import type { HelpHeading } from "../../../models/help";
defineProps<{ headings: HelpHeading[]; active?: string }>();
defineEmits<{ navigate: [id: string] }>();
</script>
