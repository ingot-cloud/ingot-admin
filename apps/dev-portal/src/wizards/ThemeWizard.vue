<template>
  <div class="wizard">
    <el-alert
      v-if="!capabilities.canWrite"
      title="静态站点不能写入 themes/。请本地运行 pnpm create:theme 或 pnpm dev:portal。"
      type="info"
      :closable="false"
      class="mb-16px"
    />
    <el-alert v-if="error" :title="error" type="error" show-icon class="mb-16px" :closable="false" />
    <FieldErrors :fields="fieldErrors" />
    <el-form label-position="top" @submit.prevent>
      <el-form-item label="主题 ID" required>
        <el-input v-model="form.id" placeholder="aurora" @change="privateInvalidate" />
      </el-form-item>
      <el-form-item label="展示名">
        <el-input v-model="form.name" @change="privateInvalidate" />
      </el-form-item>
      <el-form-item label="导出名">
        <el-input v-model="form.exportName" @change="privateInvalidate" />
      </el-form-item>
      <el-form-item label="生成 Shell 示例">
        <el-switch v-model="form.shell" @change="privateInvalidate" />
      </el-form-item>
      <el-form-item label="parts">
        <el-checkbox-group v-model="form.parts" @change="privateInvalidate">
          <el-checkbox v-for="part in schema?.themeParts ?? ['header', 'navigation', 'breadcrumb', 'footer']" :key="part" :value="part">
            {{ part }}
          </el-checkbox>
        </el-checkbox-group>
      </el-form-item>
      <el-form-item label="Token 覆盖（浅色 / 深色独立，不互相复制）">
        <TokenEditor
          :token-names="schema?.tokenNames ?? []"
          v-model:light="form.tokens.light"
          v-model:dark="form.tokens.dark"
          @change="privateInvalidate"
        />
      </el-form-item>
      <el-form-item>
        <el-button :disabled="!capabilities.canWrite" @click="privatePreview">预览</el-button>
        <el-button type="primary" :loading="submitting" :disabled="!preview || !capabilities.canWrite" @click="privateCreate">
          生成
        </el-button>
      </el-form-item>
    </el-form>
    <p class="hint">目标 themes/{{ form.id || "…" }}，包名 @ingot/theme-{{ form.id || "…" }}。创建后不会改现有 App。</p>
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
  fetchSchema,
  previewScaffold,
  type PortalCapabilities,
  type PublicSchema,
  type ScaffoldPreview,
} from "../api/client";
import FieldErrors from "./FieldErrors.vue";
import PreviewPanel from "./PreviewPanel.vue";
import ResultPanel from "./ResultPanel.vue";
import TokenEditor from "./TokenEditor.vue";

defineOptions({ name: "ThemeWizard" });

const capabilities = ref<PortalCapabilities>({ mode: "static", canWrite: false, configVersion: 1 });
const schema = ref<PublicSchema | null>(null);
const form = reactive({
  id: "",
  name: "",
  exportName: "",
  shell: false,
  parts: [] as string[],
  tokens: { light: {} as Record<string, string>, dark: {} as Record<string, string> },
});
const preview = ref<ScaffoldPreview | null>(null);
const result = ref<{ targetDir: string; packageName: string; nextSteps: ScaffoldPreview["nextSteps"] } | null>(null);
const error = ref("");
const fieldErrors = ref<Record<string, string>>({});
const submitting = ref(false);

const privateInvalidate = () => {
  preview.value = null;
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
  kind: "theme" as const,
  options: {
    id: form.id,
    name: form.name || form.id,
    exportName: form.exportName || undefined,
    shell: form.shell,
    tokens: form.tokens,
    parts: form.parts,
  },
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
  schema.value = await fetchSchema();
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
