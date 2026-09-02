<template>
  <div class="page">
    <header class="hero">
      <h1>创建 Ingot App</h1>
      <p>
        普通单后台项目请直接使用 <code>apps/admin</code>。仅在需要独立 appCode、品牌、环境、构建或部署流水线时才创建新
        App。生成结果写入仓库 <code>apps/&lt;appCode&gt;</code>，不会覆盖已有目录。
      </p>
    </header>

    <el-card shadow="never">
      <el-form :model="form" label-width="140px" @submit.prevent>
        <el-form-item label="App 编码" required>
          <el-input v-model="form.appCode" placeholder="kebab-case，如 acme-admin" />
        </el-form-item>
        <el-form-item label="标题">
          <el-input v-model="form.title" placeholder="默认与 App 编码相同" />
        </el-form-item>
        <el-form-item label="开发端口">
          <el-input v-model="form.port" placeholder="5800" />
        </el-form-item>
        <el-form-item label="官方插件">
          <el-checkbox-group v-model="form.officialPluginIds">
            <el-checkbox
              v-for="plugin in plugins"
              :key="plugin.id"
              :label="plugin.id"
              :disabled="!plugin.available"
            >
              {{ plugin.label }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="本地插件骨架">
          <el-switch v-model="form.withLocalPlugin" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="privateOnSubmit">生成</el-button>
        </el-form-item>
      </el-form>

      <el-alert v-if="message" :title="message" :type="ok ? 'success' : 'error'" show-icon :closable="false" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";

interface OfficialPluginOption {
  id: string;
  packageName: string;
  importPath: string;
  exportName: string;
  label: string;
  available: boolean;
}

const plugins = ref<OfficialPluginOption[]>([]);
const submitting = ref(false);
const ok = ref(false);
const message = ref("");

const form = reactive({
  appCode: "",
  title: "",
  port: "5800",
  officialPluginIds: ["ingot-platform", "ingot-security", "ingot-org", "ingot-member"],
  withLocalPlugin: true,
});

const privateLoadPlugins = async () => {
  const response = await fetch("/api/official-plugins");
  const data = (await response.json()) as { plugins: OfficialPluginOption[] };
  plugins.value = data.plugins ?? [];
};

const privateOnSubmit = async () => {
  submitting.value = true;
  message.value = "";
  try {
    const response = await fetch("/api/scaffold", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appCode: form.appCode,
        title: form.title || undefined,
        port: form.port,
        officialPluginIds: form.officialPluginIds,
        withLocalPlugin: form.withLocalPlugin,
      }),
    });
    const data = (await response.json()) as { ok: boolean; message?: string; appCode?: string };
    ok.value = data.ok;
    message.value = data.ok
      ? `已生成 apps/${data.appCode}。普通项目请优先使用 apps/admin。请执行 pnpm install 后 pnpm --filter ${data.appCode} dev。`
      : (data.message ?? "生成失败");
  } catch (error) {
    ok.value = false;
    message.value = error instanceof Error ? error.message : String(error);
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  void privateLoadPlugins();
});
</script>

<style>
body {
  margin: 0;
  font-family: Inter, "PingFang SC", sans-serif;
  background: #f5f7fa;
}
.page {
  max-width: 720px;
  margin: 48px auto;
  padding: 0 16px 48px;
}
.hero h1 {
  margin: 0 0 8px;
}
.hero p {
  color: #606266;
  margin: 0 0 24px;
}
</style>
