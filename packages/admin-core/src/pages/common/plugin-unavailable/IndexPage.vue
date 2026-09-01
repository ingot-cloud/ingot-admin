<template>
  <main class="min-h-screen flex items-center justify-center p-24px">
    <section class="max-w-640px w-full rounded-12px border border-solid p-24px">
      <h1 class="m-0 text-20px">插件页面不可用</h1>
      <p class="mb-0 mt-12px text-14px op-70">
        应用 {{ appCode }} 未安装页面 {{ viewPath }} 对应的插件，请检查应用插件清单与后端菜单配置。
      </p>
    </section>
  </main>
</template>

<script setup lang="ts">
defineOptions({ name: "InPluginPageUnavailable" });

defineProps<{
  appCode: string;
  viewPath: string;
}>();
</script>
