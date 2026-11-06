<template>
  <section v-if="category" class="help-list-page">
    <div class="help-breadcrumb">
      <RouterLink to="/help">帮助中心</RouterLink><span>/</span><span>{{ category.title }}</span>
    </div>
    <div class="help-category-heading">
      <span class="help-category-icon"><InIcon :name="category.icon" /></span>
      <div>
        <h1>{{ category.title }}</h1>
        <p>{{ category.description || CATEGORY_DESCRIPTION }}</p>
      </div>
    </div>
    <BizHelpArticleList :articles="articles" />
  </section>
  <BizHelpState v-else empty title="当前端没有此分类" message="请从帮助中心选择可用的功能分类。" />
</template>
<script setup lang="ts">
import { RouterLink } from "vue-router";
import BizHelpArticleList from "../../components/BizHelpArticleList.vue";
import BizHelpState from "../../components/BizHelpState.vue";
import { CATEGORY_DESCRIPTION } from "./table";
import { useOps } from "./useOps";
const { category, articles } = useOps();
</script>
