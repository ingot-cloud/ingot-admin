<template>
  <div class="help-article-list">
    <RouterLink
      v-for="article in articles"
      :key="article.id"
      class="help-article-list-item"
      :to="{ name: 'help.article', params: { articleId: article.id } }"
    >
      <div>
        <h3>{{ article.title }}</h3>
        <p v-if="!compact">{{ article.summary }}</p>
      </div>
      <InIcon name="ep:arrow-right" aria-hidden="true" />
    </RouterLink>
  </div>
</template>
<script setup lang="ts">
import { RouterLink } from "vue-router";
import type { HelpArticleSummary } from "../models/help";
defineProps<{ articles: HelpArticleSummary[]; compact?: boolean }>();
</script>
