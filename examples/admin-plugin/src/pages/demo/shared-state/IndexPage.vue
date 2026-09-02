<template>
  <in-container>
    <in-page-header title="共享状态" subtitle="验证 example.shared 与全局 Pinia 单实例" />
    <el-card shadow="never">
      <div flex flex-col gap-3>
        <el-input v-model="shared.note" placeholder="备注" />
        <div flex items-center gap-3>
          <el-statistic title="计数" :value="shared.counter" />
          <el-button type="primary" @click="shared.increment">增加</el-button>
          <el-button @click="shared.reset">重置</el-button>
        </div>
        <p text-sm color-fade>在其它页面读取同一 store，应看到相同的 counter / note（单 Pinia）。</p>
      </div>
    </el-card>
  </in-container>
</template>

<script setup lang="ts">
import { useExampleSharedStore } from "@/stores/shared";

defineOptions({
  name: "ExampleDemoSharedStatePage",
});

const shared = useExampleSharedStore();
</script>
