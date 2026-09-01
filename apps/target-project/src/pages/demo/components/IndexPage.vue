<template>
  <in-container>
    <in-page-header
      title="F · 全局组件与指令"
      subtitle="验证插件 manifest 显式注入 + 编译期自动导入并存"
    />
    <el-card shadow="never">
      <div flex flex-col gap-4>
        <div>
          <p m-b-2 text-sm>全局组件 BizTargetDemoBadge：</p>
          <BizTargetDemoBadge label="来自 targetPlugin.components" />
        </div>
        <div>
          <p m-b-2 text-sm>指令 v-demo-highlight：</p>
          <div v-demo-highlight="'demo'" p-3 border rounded>
            这段文字由插件指令高亮
          </div>
        </div>
        <div>
          <p m-b-2 text-sm>共享状态回读（E 页写入）：</p>
          <el-tag>{{ shared.note }} · {{ shared.counter }}</el-tag>
        </div>
      </div>
    </el-card>
  </in-container>
</template>

<script setup lang="ts">
import { useTargetSharedStore } from "@/stores/shared";

defineOptions({
  name: "TargetDemoComponentsPage",
});

const shared = useTargetSharedStore();
</script>

<style scoped>
:deep(.target-demo-highlight) {
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  border-color: var(--el-color-primary-light-5);
}
</style>
