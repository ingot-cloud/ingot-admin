<template>
  <AuthPageShell>
    <AuthPageLoading :loading="loading || submitting">
      <header class="auth-page-header">
        <AuthBrandLogo />
        <h1 id="auth-page-title">切换组织</h1>
        <p>请选择要进入的管理空间</p>
      </header>
      <p v-if="data && !bootstrapPending" class="organization-current">
        当前组织：{{ data.currentTenant.name || "当前组织" }}
      </p>
      <template v-if="!recovering && !bootstrapPending">
        <el-input
          v-model="keyword"
          placeholder="搜索组织名称"
          clearable
          @keyup.enter="search"
          @clear="search"
        >
          <template #append><el-button @click="search">搜索</el-button></template>
        </el-input>
        <ul v-if="data?.records.length" class="organization-list" aria-label="其他可进入的组织">
          <li v-for="item in data.records" :key="item.id">
            <TenantItem :id="item.id" :name="item.name || '组织'" @click="select(item)" />
          </li>
        </ul>
        <p v-else-if="!loading && !errorText" class="organization-empty">
          未找到匹配的组织，请调整搜索条件
        </p>
        <el-pagination
          v-if="data && data.total > 20"
          :current-page="page"
          :page-size="20"
          :total="data.total"
          layout="prev, pager, next"
          @current-change="changePage"
        />
      </template>
      <div v-if="errorText" class="organization-error" role="alert">
        <p>{{ errorText }}</p>
        <el-button @click="retry">{{
          bootstrapPending ? "重新加载当前组织" : recovering ? "重新确认切换结果" : "重试"
        }}</el-button>
      </div>
      <footer class="organization-actions">
        <el-button v-if="!recovering && !bootstrapPending" text @click="back"
          >返回当前组织</el-button
        >
        <el-button text @click="logout">退出登录</el-button>
      </footer>
    </AuthPageLoading>
  </AuthPageShell>
</template>
<script setup lang="ts">
import { ElButton, ElInput, ElPagination } from "element-plus";
import AuthPageShell from "../../components/AuthPageShell.vue";
import AuthBrandLogo from "../../components/AuthBrandLogo.vue";
import AuthPageLoading from "../../components/AuthPageLoading.vue";
import TenantItem from "../login/select-tenant/TenantItem.vue";
import { useOps } from "./useOps";
const {
  loading,
  submitting,
  keyword,
  page,
  data,
  errorText,
  recovering,
  bootstrapPending,
  select,
  retry,
  search,
  changePage,
  back,
  logout,
} = useOps();
</script>
<style scoped lang="postcss">
.organization-current {
  padding: var(--in-space-3);
  margin-bottom: var(--in-space-4);
  background: var(--in-bg-color-canvas);
  border-radius: var(--in-radius-card);
}
.organization-list {
  display: flex;
  flex-direction: column;
  gap: var(--in-space-3);
  max-height: 40svh;
  overflow-y: auto;
  padding: var(--in-space-4) 0;
  list-style: none;
}
.organization-empty {
  padding: var(--in-space-6) 0;
  color: var(--in-text-color-secondary);
}
.organization-error {
  margin-top: var(--in-space-4);
  color: var(--in-color-danger);
}
.organization-actions {
  display: flex;
  justify-content: space-between;
  margin-top: var(--in-space-5);
}
</style>
