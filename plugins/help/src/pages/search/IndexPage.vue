<template>
  <section class="help-list-page">
    <div class="help-breadcrumb">
      <RouterLink to="/help">帮助中心</RouterLink><span>/</span><span>搜索结果</span>
    </div>
    <h1>“{{ q }}”的搜索结果</h1>
    <p class="help-list-description">
      {{ loading ? "正在查找相关说明…" : `共找到 ${pageInfo.total} 篇相关说明` }}
    </p>
    <div class="help-search-filter">
      <el-select
        :model-value="selectedCategory"
        aria-label="按功能分类筛选"
        placeholder="全部分类"
        clearable
        @change="privateCategory"
      >
        <el-option
          v-for="category in categories"
          :key="category.id"
          :value="category.id"
          :label="category.title"
        />
      </el-select>
    </div>
    <BizHelpState
      v-if="loading || error"
      :loading="loading"
      :message="error instanceof Error ? error.message : undefined"
      @retry="retry"
    />
    <BizHelpState v-else-if="!pageInfo.records?.length" empty />
    <template v-else>
      <div class="help-search-results">
        <RouterLink
          v-for="hit in pageInfo.records ?? []"
          :key="hit.article.id"
          class="help-search-result"
          :to="{
            name: 'help.article',
            params: { articleId: hit.article.id },
            hash: hit.headingId ? `#${hit.headingId}` : '',
          }"
        >
          <h2>
            <template v-for="(segment, index) in hit.titleSegments" :key="index"
              ><mark v-if="segment.matched">{{ segment.text }}</mark
              ><span v-else>{{ segment.text }}</span></template
            >
          </h2>
          <p>
            <template v-for="(segment, index) in hit.snippetSegments" :key="index"
              ><mark v-if="segment.matched">{{ segment.text }}</mark
              ><span v-else>{{ segment.text }}</span></template
            >
          </p>
          <span class="help-search-meta"
            >{{ categoryTitle(hit.article.categoryId) }} · 阅读约 {{ hit.article.readMinutes }} 分钟
            · {{ formatDateTime(hit.article.updatedAt) }}</span
          >
        </RouterLink>
      </div>
      <el-pagination
        :current-page="pageInfo.current"
        :page-size="pageInfo.size"
        :total="pageInfo.total"
        layout="prev, pager, next"
        @current-change="changePage"
      />
    </template>
  </section>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { formatDateTime } from "@ingot/shared";
import { useHelpRuntime } from "../../runtime";
import { findHelpCategory } from "../../models/help";
import BizHelpState from "../../components/BizHelpState.vue";
import { useOps } from "./useOps";
const runtime = useHelpRuntime();
const route = useRoute(),
  router = useRouter();
const categories = computed(() => runtime.catalog.value?.categories ?? []);
const selectedCategory = computed(() =>
  typeof route.query.categoryId === "string" ? route.query.categoryId : undefined,
);
const privateCategory = (id: string | undefined): void => {
  void router.push({
    name: "help.search",
    query: { ...route.query, categoryId: id || undefined, page: "1" },
  });
};
const categoryTitle = (id: string): string =>
  findHelpCategory(runtime.catalog.value?.categories ?? [], id)?.title ?? "使用说明";
const { q, pageInfo, loading, error, retry, changePage } = useOps();
</script>
