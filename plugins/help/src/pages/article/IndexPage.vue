<template>
  <BizHelpState v-if="loading || error" :loading="loading" :message="error" @retry="load" />
  <div v-else-if="article" class="help-article-page">
    <article class="help-article">
      <nav class="help-breadcrumb" aria-label="文章位置">
        <RouterLink to="/help">帮助中心</RouterLink>
        <template v-for="category in trail" :key="category.id"
          ><span>/</span
          ><RouterLink :to="{ name: 'help.category', params: { categoryId: category.id } }">{{
            category.title
          }}</RouterLink></template
        >
      </nav>
      <div class="help-article-title-row">
        <h1>{{ article.title }}</h1>
        <button type="button" class="help-copy-link" aria-label="复制文章链接" @click="copyLink">
          <InIcon name="ep:link" />
        </button>
      </div>
      <div class="help-article-meta">
        <span><InIcon name="ep:clock" />阅读约 {{ article.readMinutes }} 分钟</span
        ><span>更新于 {{ formatDateTime(article.updatedAt) }}</span>
      </div>
      <div class="help-audience">
        <InIcon name="ep:info-filled" /><span>谁能操作：{{ article.audienceDescription }}</span>
      </div>
      <details
        class="help-inline-toc"
        :open="tocOpen"
        @toggle="tocOpen = ($event.target as HTMLDetailsElement).open"
      >
        <summary>本篇目录</summary>
        <BizHelpToc :headings="article.toc" :active="activeHeading" @navigate="navigate" />
      </details>
      <BizHelpMarkdown :article="article" @preview="preview" @navigate="navigate" />
      <section class="help-article-footer">
        <div v-if="targets.length" class="help-function-links">
          <RouterLink
            v-for="target in targets"
            :key="target.path"
            :to="target.path!"
            class="help-primary-button"
            >前往{{ target.name || "功能" }}<InIcon name="ep:arrow-right"
          /></RouterLink>
        </div>
        <p v-else-if="article.relatedViewPaths.length" class="help-permission-note">
          操作此功能需要相应权限，请联系管理员确认。
        </p>
        <template v-if="article.relatedArticles.length"
          ><h2>{{ ARTICLE_RELATED_TITLE }}</h2>
          <BizHelpArticleList :articles="article.relatedArticles" compact
        /></template>
        <nav class="help-neighbors" aria-label="前后文章">
          <RouterLink
            v-if="article.previousArticle"
            :to="{ name: 'help.article', params: { articleId: article.previousArticle.id } }"
            ><span>上一篇</span>{{ article.previousArticle.title }}</RouterLink
          >
          <div v-else />
          <RouterLink
            v-if="article.nextArticle"
            :to="{ name: 'help.article', params: { articleId: article.nextArticle.id } }"
            ><span>下一篇</span>{{ article.nextArticle.title }}</RouterLink
          >
        </nav>
      </section>
    </article>
    <aside class="help-article-outline">
      <BizHelpToc :headings="article.toc" :active="activeHeading" @navigate="navigate" />
    </aside>
    <BizHelpImagePreview
      v-if="previewIndex >= 0"
      :assets="article.assets"
      :index="previewIndex"
      :version="article.contentVersion"
      @close="previewIndex = -1"
      @select="previewIndex = $event"
    />
  </div>
</template>
<script setup lang="ts">
import { RouterLink } from "vue-router";
import { formatDateTime } from "@ingot/shared";
import BizHelpState from "../../components/BizHelpState.vue";
import BizHelpToc from "./components/BizHelpToc.vue";
import BizHelpMarkdown from "./components/BizHelpMarkdown.vue";
import BizHelpArticleList from "../../components/BizHelpArticleList.vue";
import BizHelpImagePreview from "./components/BizHelpImagePreview.vue";
import { ARTICLE_RELATED_TITLE } from "./table";
import { useOps } from "./useOps";
const {
  article,
  loading,
  error,
  activeHeading,
  navigate,
  copyLink,
  previewIndex,
  preview,
  targets,
  tocOpen,
  trail,
  load,
} = useOps();
</script>
