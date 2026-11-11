<template>
  <main class="navigation-error-page">
    <section class="navigation-error-card" role="alert">
      <h1>导航配置冲突</h1>
      <p>暂时无法打开工作台。请联系管理员修正菜单配置后，重新加载。</p>
      <p v-if="conflict" class="navigation-error-detail">
        {{ conflict.kind === "path" ? "菜单访问地址重复" : "菜单路由名称重复" }}：
        <code>{{ conflict.value }}</code>
      </p>
      <div class="flex flex-wrap gap-12px mt-24px">
        <in-button type="primary" @in-click="privateOnRetry">重新加载配置</in-button>
        <in-button @in-click="privateOnRelogin">重新登录</in-button>
      </div>
    </section>
  </main>
</template>
<script setup lang="ts">
import { navigationRecoveryPath } from "@/router/navigationError";
import { useRouterStore } from "@/stores/modules/router";
import { useLogin } from "@/hooks/biz/useLogin";

const route = useRoute();
const store = useRouterStore();
const conflict = computed(() => store.configurationError);
const privateOnRetry = (): void => {
  window.location.replace(navigationRecoveryPath(route.query.returnTo));
};
const privateOnRelogin = (): void => {
  void useLogin().go({ rememberReturnTo: false });
};
</script>
<style scoped lang="postcss">
.navigation-error-page {
  @apply min-h-100dvh w-full flex items-center justify-center box-border;
  padding: var(--in-space-6);
  background: var(--in-bg-color-canvas);
  color: var(--in-text-color);
}
.navigation-error-card {
  width: 100%;
  max-width: 640px;
  padding: var(--in-space-6);
  border: 1px solid var(--in-border-color);
  border-radius: var(--in-radius-card);
  background: var(--in-bg-color-surface);
}
.navigation-error-card h1 {
  margin-bottom: var(--in-space-4);
  font-size: var(--in-font-size-page-title);
}
.navigation-error-detail {
  margin-top: var(--in-space-4);
  overflow-wrap: anywhere;
}
</style>
