<template>
  <div class="help-home">
    <section class="help-hero">
      <span class="help-hero-eyebrow">让每一步操作更清晰</span>
      <h1>{{ HELP_HOME_TITLE }}</h1>
      <p>{{ HELP_HOME_DESCRIPTION }}</p>
      <BizHelpSearch large />
      <div class="help-hero-dots" aria-hidden="true"><span /><span /><span /></div>
    </section>
    <div class="help-home-content">
      <section class="help-home-section">
        <h2>快速入门</h2>
        <p class="help-section-intro">从这里开始，了解系统并完成基础设置</p>
        <div class="help-quick-grid">
          <RouterLink
            v-for="(article, index) in quick"
            :key="article.id"
            :to="{ name: 'help.article', params: { articleId: article.id } }"
            class="help-quick-card"
            :class="`is-tone-${index % 3}`"
          >
            <span class="help-card-number">0{{ index + 1 }}</span>
            <h3>{{ article.title }}<InIcon name="ep:arrow-right" /></h3>
            <p>{{ article.summary }}</p>
            <span class="help-card-illustration" aria-hidden="true"
              ><InIcon :name="QUICK_ICONS[index % QUICK_ICONS.length]"
            /></span>
          </RouterLink>
        </div>
      </section>
      <section class="help-home-section">
        <h2>按功能查找</h2>
        <p class="help-section-intro">浏览完整的使用指南，快速找到所需说明</p>
        <div class="help-category-grid">
          <RouterLink
            v-for="category in categories"
            :key="category.id"
            :to="{ name: 'help.category', params: { categoryId: category.id } }"
            class="help-category-card"
          >
            <span class="help-category-icon"><InIcon :name="category.icon" /></span>
            <div>
              <h3>{{ category.title }}</h3>
              <p>{{ category.description }}</p>
            </div>
            <InIcon name="ep:arrow-right" class="help-category-arrow" />
          </RouterLink>
        </div>
      </section>
      <section class="help-home-lists">
        <div>
          <h2>常见问题</h2>
          <BizHelpArticleList :articles="faq" compact />
        </div>
        <div>
          <h2>近期更新</h2>
          <BizHelpArticleList :articles="recent" compact />
        </div>
      </section>
    </div>
  </div>
</template>
<script setup lang="ts">
import { RouterLink } from "vue-router";
import BizHelpSearch from "../../components/BizHelpSearch.vue";
import BizHelpArticleList from "../../components/BizHelpArticleList.vue";
import { HELP_HOME_TITLE, HELP_HOME_DESCRIPTION } from "./table";
import { useOps } from "./useOps";
const QUICK_ICONS = ["ep:compass", "ep:connection", "ep:reading"];
const { categories, quick, faq, recent } = useOps();
</script>
