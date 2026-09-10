<template>
  <div class="wizard">
    <el-alert
      v-if="!capabilities.canWrite"
      title="当前是静态站点，只可浏览默认配置。请在仓库执行 pnpm dev:portal 后才能写入本地目录。"
      type="info"
      :closable="false"
      class="mb-16px"
    />
    <el-alert v-if="error" :title="error" type="error" show-icon class="mb-16px" :closable="false" />
    <FieldErrors :fields="fieldErrors" />
    <el-form label-position="top" @submit.prevent>
      <el-collapse v-model="openPanels">
        <el-collapse-item title="基础与构建" name="base">
          <el-form-item label="App 编码" required>
            <el-input v-model="form.appCode" placeholder="kebab-case，如 acme-admin" @change="privateOnAppCode" />
            <p class="hint">目录 apps/{{ form.appCode || "…" }}，包名沿用现有命名。编码同时写入各 mode 的 VITE_APP_CODE。</p>
          </el-form-item>
          <el-form-item label="品牌 Logo（路径或 URL）">
            <el-input v-model="form.logo" placeholder="可空" @change="privateInvalidate" />
          </el-form-item>
          <el-form-item label="开发端口">
            <el-input v-model="form.port" @change="privateOnPort" />
          </el-form-item>
          <el-form-item label="Host">
            <el-input v-model="form.host" @change="privateInvalidate" />
          </el-form-item>
          <el-form-item label="构建 base">
            <el-input v-model="form.base" placeholder="/" @change="privateInvalidate" />
            <p class="hint">同步 Vite publicPath / 路由子路径。</p>
          </el-form-item>
          <el-form-item label="DevTools">
            <el-switch v-model="form.enableDevTools" @change="privateInvalidate" />
          </el-form-item>
          <el-form-item label="本地 Demo 页">
            <el-switch v-model="form.withDemo" @change="privateInvalidate" />
          </el-form-item>
        </el-collapse-item>
        <el-collapse-item title="环境变量" name="env">
          <EnvEditor
            :fields="schema?.envFields ?? []"
            v-model:common="form.envCommon"
            v-model:modes="form.envModes"
            v-model:custom-vars="form.customVars"
            @change="privateInvalidate"
          />
        </el-collapse-item>
        <el-collapse-item title="代理与图标" name="network">
          <div v-for="(rule, index) in form.proxy" :key="index" class="proxy-row">
            <el-input v-model="rule.prefix" placeholder="prefix" @change="privateInvalidate" />
            <el-input v-model="rule.target" placeholder="target" @change="privateInvalidate" />
            <el-switch v-model="rule.changeOrigin" @change="privateInvalidate" />
            <el-switch v-model="rule.stripPrefix" @change="privateInvalidate" />
            <el-button @click="privateRemoveProxy(index)">删除</el-button>
          </div>
          <el-button class="mb-16px" @click="privateAddProxy">添加代理</el-button>
          <el-form-item label="Iconify collections（逗号分隔）">
            <el-input v-model="form.iconCollections" @change="privateInvalidate" />
          </el-form-item>
          <el-form-item label="extra collections">
            <el-input v-model="form.iconExtra" @change="privateInvalidate" />
          </el-form-item>
          <el-form-item label="扫描源码图标">
            <el-switch v-model="form.iconScan" @change="privateInvalidate" />
          </el-form-item>
          <el-form-item label="usedFile">
            <el-input v-model="form.iconUsedFile" @change="privateInvalidate" />
          </el-form-item>
        </el-collapse-item>
        <el-collapse-item title="插件与主题" name="plugins">
          <el-form-item label="仓库插件">
            <el-checkbox-group v-model="form.pluginNames" @change="privateInvalidate">
              <el-checkbox
                v-for="plugin in catalog.plugins"
                :key="plugin.packageName"
                :value="plugin.packageName"
                :disabled="!plugin.available && plugin.source !== 'manual'"
              >
                {{ plugin.label || plugin.packageName }}
              </el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          <el-form-item label="主题">
            <el-radio-group v-model="form.themePackage" @change="privateInvalidate">
              <el-radio value="@ingot/admin-core">defaultAdminTheme</el-radio>
              <el-radio v-for="theme in workspaceThemes" :key="theme.packageName" :value="theme.packageName">
                {{ theme.label }}
              </el-radio>
            </el-radio-group>
          </el-form-item>
        </el-collapse-item>
        <el-collapse-item title="顶栏" name="header">
          <p class="hint">搜索显隐由环境变量 VITE_APP_SETTINGS_SHOW_SEARCH 控制，避免双源。</p>
          <el-form-item label="品牌可见">
            <el-switch v-model="form.header.brand" @change="privateInvalidate" />
          </el-form-item>
          <el-form-item label="导航可见">
            <el-switch v-model="form.header.navigation" @change="privateInvalidate" />
          </el-form-item>
          <el-form-item label="用户区可见">
            <el-switch v-model="form.header.user" @change="privateInvalidate" />
          </el-form-item>
          <el-form-item label="内置小部件（顺序即排列）">
            <el-checkbox-group v-model="form.header.utilities" @change="privateInvalidate">
              <el-checkbox v-for="name in schema?.headerUtilities ?? []" :key="name" :value="name">{{ name }}</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          <el-form-item label="用户菜单">
            <el-checkbox-group v-model="form.header.userMenu" @change="privateInvalidate">
              <el-checkbox v-for="name in schema?.headerUserMenu ?? []" :key="name" :value="name">{{ name }}</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </el-collapse-item>
        <el-collapse-item title="代码扩展" name="ext">
          <el-form-item label="网络拦截器示例">
            <el-switch v-model="form.extensions.netInterceptors" @change="privateInvalidate" />
          </el-form-item>
          <el-form-item label="shellSlots 示例">
            <el-switch v-model="form.extensions.shellSlots" @change="privateInvalidate" />
          </el-form-item>
          <el-form-item label="Vite 扩展文件">
            <el-switch v-model="form.extensions.vite" @change="privateInvalidate" />
          </el-form-item>
        </el-collapse-item>
      </el-collapse>
      <el-form-item class="mt-16px">
        <el-button :disabled="!capabilities.canWrite" @click="privatePreview">预览</el-button>
        <el-button type="primary" :loading="submitting" :disabled="!preview || !capabilities.canWrite" @click="privateCreate">
          生成
        </el-button>
      </el-form-item>
    </el-form>
    <p v-if="targetHint" class="hint">目标目录 {{ targetHint }}，包名 {{ form.appCode || "（待填写）" }}</p>
    <PreviewPanel v-if="preview" :preview="preview" />
    <ResultPanel v-if="result" :result="result" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import {
  PortalApiError,
  createScaffold,
  detectCapabilities,
  fetchCatalog,
  fetchSchema,
  previewScaffold,
  type CatalogItem,
  type PortalCapabilities,
  type PublicSchema,
  type ScaffoldPreview,
} from "../api/client";
import EnvEditor from "./EnvEditor.vue";
import FieldErrors from "./FieldErrors.vue";
import PreviewPanel from "./PreviewPanel.vue";
import ResultPanel from "./ResultPanel.vue";

defineOptions({ name: "AppWizard" });

const capabilities = ref<PortalCapabilities>({ mode: "static", canWrite: false, configVersion: 1 });
const schema = ref<PublicSchema | null>(null);
const catalog = reactive<{ plugins: CatalogItem[]; themes: CatalogItem[] }>({ plugins: [], themes: [] });
const form = reactive({
  appCode: "",
  logo: "",
  port: "5800",
  host: "localhost",
  base: "/",
  enableDevTools: true,
  pluginNames: ["@ingot/platform-plugin", "@ingot/security-plugin", "@ingot/org-plugin", "@ingot/member-plugin"],
  themePackage: "@ingot/admin-core",
  withDemo: true,
  envCommon: {} as Record<string, string>,
  envModes: { development: {}, production: {} } as Record<string, Record<string, string>>,
  customVars: [] as Array<{ key: string; value: string }>,
  proxy: [{ prefix: "/api", target: "http://localhost:7980", changeOrigin: true, stripPrefix: true }],
  iconCollections: "ep",
  iconExtra: "",
  iconScan: true,
  iconUsedFile: "iconify-offline.used.json",
  header: {
    brand: true,
    navigation: true,
    user: true,
    utilities: ["fullscreen", "settings"],
    userMenu: ["switchOrg", "fixPwd", "logout"],
  },
  extensions: { netInterceptors: false, shellSlots: false, vite: false },
});
const preview = ref<ScaffoldPreview | null>(null);
const result = ref<{ targetDir: string; packageName: string; nextSteps: ScaffoldPreview["nextSteps"] } | null>(null);
const error = ref("");
const fieldErrors = ref<Record<string, string>>({});
const submitting = ref(false);
const openPanels = ref(["base", "env"]);
const titleDirty = ref(false);
const storeDirty = ref(false);
const callbackDirty = ref(false);

const workspaceThemes = computed(() => catalog.themes.filter((theme) => theme.packageName !== "@ingot/admin-core"));
const targetHint = computed(() => (form.appCode ? `apps/${form.appCode}` : ""));

const privateInvalidate = () => {
  preview.value = null;
};

const deriveFromCode = () => {
  const code = form.appCode.trim();
  if (!code) {
    return;
  }
  form.envCommon = {
    ...form.envCommon,
    VITE_APP_CODE: code,
    VITE_APP_TITLE: titleDirty.value ? form.envCommon.VITE_APP_TITLE : code,
    VITE_APP_SYMBOL: form.envCommon.VITE_APP_SYMBOL || code,
    VITE_APP_STORE_PREFIX: storeDirty.value
      ? form.envCommon.VITE_APP_STORE_PREFIX
      : `__${code.replace(/-/g, "_")}__`,
  };
};

const privateOnAppCode = () => {
  deriveFromCode();
  privateInvalidate();
};

const privateOnPort = () => {
  if (!callbackDirty.value) {
    form.envCommon = {
      ...form.envCommon,
      VITE_APP_LOGIN_CALLBACK_URI: `http://localhost:${form.port || "5800"}`,
    };
  }
  privateInvalidate();
};

const privateAddProxy = () => {
  form.proxy.push({ prefix: "/api", target: "http://localhost:7980", changeOrigin: true, stripPrefix: true });
  privateInvalidate();
};

const privateRemoveProxy = (index: number) => {
  form.proxy.splice(index, 1);
  privateInvalidate();
};

const buildEnv = () => {
  const common = { ...form.envCommon };
  for (const item of form.customVars) {
    if (item.key.trim()) {
      common[item.key.trim()] = item.value;
    }
  }
  if (common.VITE_APP_TITLE !== form.appCode) {
    titleDirty.value = true;
  }
  return { common, modes: form.envModes };
};

const officialExport = (packageName: string) =>
  schema.value?.officialPlugins?.find((plugin) => plugin.packageName === packageName)?.exportName ||
  (
    {
      "@ingot/platform-plugin": "platformPlugin",
      "@ingot/security-plugin": "securityPlugin",
      "@ingot/org-plugin": "orgPlugin",
      "@ingot/member-plugin": "memberPlugin",
    } as Record<string, string>
  )[packageName] ||
  "";

const buildRequest = () => ({
  version: 1,
  kind: "app" as const,
  options: {
    appCode: form.appCode,
    withDemo: form.withDemo,
    branding: { logo: form.logo },
    plugins: form.pluginNames.map((packageName) => {
      const item = catalog.plugins.find((plugin) => plugin.packageName === packageName);
      return {
        packageName,
        exportName: item?.exportName || officialExport(packageName),
      };
    }),
    theme:
      form.themePackage === "@ingot/admin-core"
        ? { kind: "default" as const }
        : {
            kind: "workspace" as const,
            packageName: form.themePackage,
            exportName: workspaceThemes.value.find((theme) => theme.packageName === form.themePackage)?.exportName ?? "",
          },
    dev: { port: Number(form.port), host: form.host, enableDevTools: form.enableDevTools },
    build: { base: form.base || "/" },
    proxy: form.proxy,
    iconify: {
      collections: form.iconCollections.split(/[,\s]+/).filter(Boolean),
      extra: form.iconExtra.split(/[,\s]+/).filter(Boolean),
      scan: form.iconScan,
      usedFile: form.iconUsedFile,
    },
    header: {
      visibility: {
        brand: form.header.brand,
        navigation: form.header.navigation,
        search: form.envCommon.VITE_APP_SETTINGS_SHOW_SEARCH !== "false",
        user: form.header.user,
      },
      builtinUtilities: form.header.utilities,
      builtinUserMenu: form.header.userMenu,
    },
    extensions: { ...form.extensions },
    env: buildEnv(),
  },
});

const captureError = (err: unknown) => {
  if (err instanceof PortalApiError) {
    error.value = err.message;
    fieldErrors.value = err.fields ?? {};
    return;
  }
  error.value = err instanceof Error ? err.message : String(err);
  fieldErrors.value = {};
};

const privatePreview = async () => {
  error.value = "";
  fieldErrors.value = {};
  result.value = null;
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
  fieldErrors.value = {};
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
  try {
    capabilities.value = await detectCapabilities();
  } catch (err) {
    captureError(err);
  }
  try {
    schema.value = await fetchSchema();
    const defaults = schema.value?.defaults.app as
      | {
          env?: { common?: Record<string, string>; modes?: Record<string, Record<string, string>> };
        }
      | undefined;
    if (defaults?.env?.common) {
      form.envCommon = { ...defaults.env.common };
      delete form.envCommon.VITE_APP_TENANT;
    }
    if (defaults?.env?.modes) {
      form.envModes = JSON.parse(JSON.stringify(defaults.env.modes));
    }
  } catch (err) {
    captureError(err);
  }
  if (!capabilities.value.canWrite) {
    return;
  }
  try {
    const data = await fetchCatalog();
    catalog.plugins = data.plugins;
    catalog.themes = data.themes;
  } catch (err) {
    captureError(err);
  }
});
</script>

<style scoped>
.hint {
  color: var(--vp-c-text-2);
  font-size: 13px;
}
.mb-16px {
  margin-bottom: 16px;
}
.mt-16px {
  margin-top: 16px;
}
.proxy-row {
  display: grid;
  grid-template-columns: 1fr 1.4fr auto auto auto;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
}
@media (max-width: 768px) {
  .proxy-row {
    grid-template-columns: 1fr;
  }
}
</style>
