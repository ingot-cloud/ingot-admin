<template>
  <div class="wizard">
    <el-alert
      v-if="!capabilities.canWrite"
      title="静态站点不能写入 plugins/。请本地运行 pnpm create:plugin 或 pnpm dev:portal。"
      type="info"
      :closable="false"
      class="mb-16px"
    />
    <el-alert v-if="error" :title="error" type="error" show-icon class="mb-16px" :closable="false" />
    <FieldErrors :fields="fieldErrors" />
    <el-form label-position="top" @submit.prevent>
      <el-form-item label="目录 ID" required>
        <el-input v-model="form.directoryId" placeholder="sales" @change="privateOnDirectory" />
      </el-form-item>
      <el-form-item label="插件 ID">
        <el-input v-model="form.pluginId" @change="privateInvalidate" />
      </el-form-item>
      <el-form-item label="导出名">
        <el-input v-model="form.exportName" @change="privateInvalidate" />
      </el-form-item>
      <el-form-item label="canonical prefix">
        <el-input v-model="form.canonicalPrefix" @change="privateInvalidate" />
      </el-form-item>
      <el-form-item label="说明">
        <el-input v-model="form.description" @change="privateInvalidate" />
      </el-form-item>
      <el-form-item label="Demo（页面四件套）">
        <el-switch v-model="form.withDemo" @change="privateInvalidate" />
      </el-form-item>
      <el-form-item label="扩展">
        <el-checkbox v-model="form.extensions.layouts" @change="privateInvalidate">layouts</el-checkbox>
        <el-checkbox v-model="form.extensions.components" @change="privateInvalidate">Biz 组件</el-checkbox>
        <el-checkbox v-model="form.extensions.directives" @change="privateInvalidate">directives</el-checkbox>
        <el-checkbox v-model="form.extensions.stores" @change="privateInvalidate">stores</el-checkbox>
        <el-checkbox v-model="form.extensions.install" @change="privateInvalidate">install</el-checkbox>
      </el-form-item>
      <el-form-item>
        <el-button :disabled="!capabilities.canWrite" @click="privatePreview">预览</el-button>
        <el-button type="primary" :loading="submitting" :disabled="!preview || !capabilities.canWrite" @click="privateCreate">
          生成
        </el-button>
      </el-form-item>
    </el-form>
    <p class="hint">目标 plugins/{{ form.directoryId || "…" }}，包名 @ingot/{{ form.directoryId || "…" }}-plugin</p>
    <PreviewPanel v-if="preview" :preview="preview" />
    <ResultPanel v-if="result" :result="result" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import {
  PortalApiError,
  createScaffold,
  detectCapabilities,
  previewScaffold,
  type PortalCapabilities,
  type ScaffoldPreview,
} from "../api/client";
import FieldErrors from "./FieldErrors.vue";
import PreviewPanel from "./PreviewPanel.vue";
import ResultPanel from "./ResultPanel.vue";

defineOptions({ name: "PluginWizard" });

const capabilities = ref<PortalCapabilities>({ mode: "static", canWrite: false, configVersion: 1 });
const form = reactive({
  directoryId: "",
  pluginId: "",
  exportName: "",
  canonicalPrefix: "",
  description: "",
  withDemo: true,
  extensions: {
    layouts: false,
    components: false,
    directives: false,
    stores: false,
    install: false,
  },
});
const preview = ref<ScaffoldPreview | null>(null);
const result = ref<{ targetDir: string; packageName: string; nextSteps: ScaffoldPreview["nextSteps"] } | null>(null);
const error = ref("");
const fieldErrors = ref<Record<string, string>>({});
const submitting = ref(false);
const derivedDirty = ref(false);

const privateInvalidate = () => {
  preview.value = null;
};

const toCamel = (kebab: string) =>
  kebab
    .split("-")
    .filter(Boolean)
    .map((part, index) => (index === 0 ? part : `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`))
    .join("");

const privateOnDirectory = () => {
  const id = form.directoryId.trim();
  if (!derivedDirty.value && id) {
    form.pluginId = `ingot-${id}`;
    form.exportName = `${toCamel(id)}Plugin`;
    form.canonicalPrefix = id.replace(/-/g, ".");
  }
  derivedDirty.value = Boolean(form.pluginId && form.pluginId !== `ingot-${id}`);
  privateInvalidate();
};

const captureError = (err: unknown) => {
  if (err instanceof PortalApiError) {
    error.value = err.message;
    fieldErrors.value = err.fields ?? {};
    return;
  }
  error.value = err instanceof Error ? err.message : String(err);
};

const buildRequest = () => ({
  version: 1,
  kind: "plugin" as const,
  options: { ...form },
});

const privatePreview = async () => {
  error.value = "";
  fieldErrors.value = {};
  try {
    preview.value = await previewScaffold(buildRequest());
  } catch (err) {
    captureError(err);
  }
};

const privateCreate = async () => {
  if (!preview.value) {
    return;
  }
  submitting.value = true;
  error.value = "";
  try {
    result.value = await createScaffold(buildRequest(), preview.value.fingerprint);
    preview.value = null;
  } catch (err) {
    captureError(err);
  } finally {
    submitting.value = false;
  }
};

onMounted(async () => {
  capabilities.value = await detectCapabilities();
});
</script>

<style scoped>
.hint {
  color: var(--vp-c-text-2);
}
.mb-16px {
  margin-bottom: 16px;
}
</style>
