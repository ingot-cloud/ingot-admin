<template>
  <in-container>
    <in-page-header title="全局组件与指令" subtitle="验证插件 manifest 显式注入 + 编译期自动导入并存" />
    <el-card shadow="never">
      <div flex flex-col gap-4>
        <div>
          <p m-b-2 text-sm>全局组件 BizExampleDemoBadge：</p>
          <BizExampleDemoBadge label="来自 exampleAdminPlugin.components" />
        </div>
        <div>
          <p m-b-2 text-sm>指令 v-demo-highlight：</p>
          <div v-demo-highlight="'demo'" p-3 border rounded>这段文字由插件指令高亮</div>
        </div>
        <div>
          <p m-b-2 text-sm>共享状态回读：</p>
          <el-tag>{{ shared.note }} · {{ shared.counter }}</el-tag>
        </div>
      </div>
    </el-card>
  </in-container>
</template>

<script setup lang="ts">
import { useExampleSharedStore } from "@/stores/shared";

defineOptions({
  name: "ExampleDemoComponentsPage",
});

const shared = useExampleSharedStore();
</script>

<style scoped>
:deep(.example-demo-highlight) {
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  border-color: var(--el-color-primary-light-5);
}
</style>
