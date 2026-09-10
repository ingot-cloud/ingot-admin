<template>
  <div class="env-editor">
    <p class="hint">
      公共值写入 <code>.env</code>。mode 覆盖写入 <code>.env.&lt;mode&gt;</code>；留空表示继承公共值，显式空字符串表示清空。生产环境请核对部署地址，不会复制本机 .env.local。
    </p>
    <el-tabs v-model="activeMode">
      <el-tab-pane label="公共" name="common">
        <div v-for="group in groups" :key="group.id" class="group">
          <h4>{{ group.label }}</h4>
          <el-form-item v-for="field in group.fields" :key="field.key" :required="field.required">
            <template #label>
              {{ field.label }}
              <a v-if="field.docs" class="docs" :href="withBase(field.docs)" target="_blank" rel="noreferrer">说明</a>
            </template>
            <el-select
              v-if="field.control === 'enum'"
              :model-value="common[field.key]"
              @update:model-value="(value: string) => privateSetCommon(field.key, value)"
            >
              <el-option v-for="option in field.options ?? []" :key="option" :label="option" :value="option" />
            </el-select>
            <el-switch
              v-else-if="field.control === 'boolean'"
              :model-value="common[field.key] === 'true'"
              @update:model-value="(value: string | number | boolean) => privateSetCommon(field.key, value ? 'true' : 'false')"
            />
            <el-input
              v-else
              :model-value="common[field.key]"
              :disabled="field.key === 'VITE_APP_CODE'"
              @update:model-value="(value: string) => privateSetCommon(field.key, value)"
            />
            <p v-if="field.hint" class="hint">{{ field.hint }}</p>
            <p v-if="field.output === 'custom-only'" class="hint">遗留未消费项，默认不输出。</p>
          </el-form-item>
        </div>
        <h4>自定义变量</h4>
        <div v-for="(item, index) in customVars" :key="index" class="custom-row">
          <el-input v-model="item.key" placeholder="VITE_CUSTOM_KEY" @change="emit('change')" />
          <el-input v-model="item.value" placeholder="值" @change="emit('change')" />
          <el-button @click="privateRemoveCustom(index)">删除</el-button>
        </div>
        <el-button @click="privateAddCustom">新增变量</el-button>
      </el-tab-pane>
      <el-tab-pane v-for="mode in modeNames" :key="mode" :label="mode" :name="mode">
        <p class="hint">
          当前生效值相对公共文件计算。生产 mode 请检查登录回调和接口地址。
        </p>
        <el-form-item v-for="field in overlayFields" :key="`${mode}-${field.key}`" :label="field.label">
          <div class="overlay-row">
            <el-input
              :model-value="modes[mode]?.[field.key] ?? ''"
              :placeholder="`继承：${effective(field.key, mode) || '（空）'}`"
              @update:model-value="(value: string) => privateSetMode(mode, field.key, value, false)"
            />
            <el-button text @click="privateSetMode(mode, field.key, '', true)">清空</el-button>
          </div>
          <p class="hint">生效：{{ effective(field.key, mode) || "（空）" }}</p>
        </el-form-item>
      </el-tab-pane>
    </el-tabs>
    <el-form-item label="新增 mode">
      <el-input v-model="newMode" placeholder="kebab-case，不能是 local" />
      <el-button class="mt-8px" @click="privateAddMode">添加</el-button>
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { withBase } from "vitepress";
import type { EnvFieldSchema } from "../api/client";

const GROUP_LABELS: Record<string, string> = {
  identity: "身份与品牌",
  login: "登录",
  network: "网络",
  storage: "存储",
  ui: "界面",
  request: "请求与资源",
  legacy: "遗留",
};

const props = defineProps<{
  fields: EnvFieldSchema[];
  common: Record<string, string>;
  modes: Record<string, Record<string, string>>;
  customVars: Array<{ key: string; value: string }>;
}>();

const emit = defineEmits<{
  change: [];
  "update:common": [value: Record<string, string>];
  "update:modes": [value: Record<string, Record<string, string>>];
  "update:customVars": [value: Array<{ key: string; value: string }>];
}>();

const activeMode = ref("common");
const newMode = ref("");

const groups = computed(() => {
  const byGroup = new Map<string, EnvFieldSchema[]>();
  for (const field of props.fields) {
    const list = byGroup.get(field.group) ?? [];
    list.push(field);
    byGroup.set(field.group, list);
  }
  return [...byGroup.entries()].map(([id, fields]) => ({
    id,
    label: GROUP_LABELS[id] ?? id,
    fields,
  }));
});

const modeNames = computed(() => Object.keys(props.modes));
const overlayFields = computed(() => props.fields.filter((field) => field.consumed !== false));

const privateSetCommon = (key: string, value: string) => {
  emit("update:common", { ...props.common, [key]: value });
  emit("change");
};

const privateSetMode = (mode: string, key: string, value: string, explicitEmpty = false) => {
  const current = { ...(props.modes[mode] ?? {}) };
  if (!explicitEmpty && value === "") {
    delete current[key];
  } else {
    current[key] = value;
  }
  emit("update:modes", {
    ...props.modes,
    [mode]: current,
  });
  emit("change");
};

const effective = (key: string, mode: string) => {
  const overlay = props.modes[mode] ?? {};
  if (Object.prototype.hasOwnProperty.call(overlay, key)) {
    return overlay[key];
  }
  return props.common[key] ?? "";
};

const privateAddCustom = () => {
  emit("update:customVars", [...props.customVars, { key: "", value: "" }]);
  emit("change");
};

const privateRemoveCustom = (index: number) => {
  emit(
    "update:customVars",
    props.customVars.filter((_, current) => current !== index),
  );
  emit("change");
};

const privateAddMode = () => {
  const mode = newMode.value.trim();
  if (!mode || props.modes[mode]) {
    return;
  }
  emit("update:modes", { ...props.modes, [mode]: {} });
  newMode.value = "";
  activeMode.value = mode;
  emit("change");
};
</script>

<style scoped>
.hint {
  color: var(--vp-c-text-2);
  font-size: 13px;
}
.docs {
  margin-left: 8px;
  font-weight: 400;
}
.group h4,
h4 {
  margin: 16px 0 8px;
}
.custom-row,
.overlay-row {
  display: grid;
  gap: 8px;
  margin-bottom: 8px;
}
.custom-row {
  grid-template-columns: 1fr 1fr auto;
}
.overlay-row {
  grid-template-columns: 1fr auto;
}
.mt-8px {
  margin-top: 8px;
}
</style>
