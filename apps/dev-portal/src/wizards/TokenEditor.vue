<template>
  <div class="token-editor">
    <el-input v-model="keyword" placeholder="搜索 Token" class="mb-12px" />
    <el-collapse>
      <el-collapse-item v-for="group in groups" :key="group.id" :title="`${group.id}（${group.tokens.length}）`">
        <div v-for="token in group.tokens" :key="token" class="token-row">
          <code>{{ token }}</code>
          <el-input
            :model-value="light[token] ?? ''"
            placeholder="浅色覆盖"
            @update:model-value="(value: string) => privateSet('light', token, value)"
          />
          <el-input
            :model-value="dark[token] ?? ''"
            placeholder="深色覆盖"
            @update:model-value="(value: string) => privateSet('dark', token, value)"
          />
          <el-button
            text
            :disabled="!light[token] && !dark[token]"
            @click="privateClear(token)"
          >
            清除
          </el-button>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

const props = defineProps<{
  tokenNames: string[];
  light: Record<string, string>;
  dark: Record<string, string>;
}>();

const emit = defineEmits<{
  change: [];
  "update:light": [value: Record<string, string>];
  "update:dark": [value: Record<string, string>];
}>();

const keyword = ref("");

const groups = computed(() => {
  const q = keyword.value.trim().toLowerCase();
  const names = props.tokenNames.filter((name) => !q || name.toLowerCase().includes(q));
  const map = new Map<string, string[]>();
  for (const name of names) {
    const parts = name.replace(/^--in-/, "").split("-");
    const id = parts[0] || "other";
    const list = map.get(id) ?? [];
    list.push(name);
    map.set(id, list);
  }
  return [...map.entries()].map(([id, tokens]) => ({ id, tokens }));
});

const privateSet = (mode: "light" | "dark", token: string, value: string) => {
  const current = { ...(mode === "light" ? props.light : props.dark) };
  if (value) {
    current[token] = value;
  } else {
    delete current[token];
  }
  if (mode === "light") {
    emit("update:light", current);
  } else {
    emit("update:dark", current);
  }
  emit("change");
};

const privateClear = (token: string) => {
  const light = { ...props.light };
  const dark = { ...props.dark };
  delete light[token];
  delete dark[token];
  emit("update:light", light);
  emit("update:dark", dark);
  emit("change");
};
</script>

<style scoped>
.mb-12px {
  margin-bottom: 12px;
}
.token-row {
  display: grid;
  grid-template-columns: minmax(160px, 1.4fr) 1fr 1fr auto;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}
@media (max-width: 768px) {
  .token-row {
    grid-template-columns: 1fr;
  }
}
</style>
