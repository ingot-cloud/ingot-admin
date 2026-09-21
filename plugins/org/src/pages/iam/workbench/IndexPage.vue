<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header description="当前身份可用的业务入口。同时受开通、人群和页面操作约束。" />
    </template>
    <in-split-layout>
      <div class="flex flex-wrap gap-16px p-16px">
        <router-link
          v-for="item in entries"
          :key="item.path"
          :to="item.path"
          class="min-w-200px rounded-8px border p-16px no-underline text-[var(--in-text-color)]"
        >
          <div>{{ item.title }}</div>
          <div v-if="item.ancestors.length" class="mt-4px text-12px text-[var(--el-text-color-secondary)]">
            {{ item.ancestors.join(" / ") }}
          </div>
        </router-link>
        <div v-if="!entries.length">当前没有可见页面入口</div>
      </div>
    </in-split-layout>
  </in-page-frame>
</template>

<script lang="ts" setup>
import { storeToRefs } from "pinia";
import { useRouterStore } from "@ingot/admin-core";

interface WorkbenchEntry {
  path: string;
  title: string;
  ancestors: string[];
}

const { getMenus } = storeToRefs(useRouterStore());

const flatten = (
  nodes: Array<{ path?: string; title?: string; children?: unknown[] }>,
  ancestors: string[],
): WorkbenchEntry[] => {
  const result: WorkbenchEntry[] = [];
  for (const node of nodes) {
    const title = node.title?.trim() ?? "";
    const children = (node.children ?? []) as Array<{ path?: string; title?: string; children?: unknown[] }>;
    if (children.length) {
      result.push(...flatten(children, title ? [...ancestors, title] : ancestors));
      continue;
    }
    if (!node.path || !title) {
      continue;
    }
    result.push({ path: node.path, title, ancestors });
  }
  return result;
};

const entries = computed(() => flatten(getMenus.value, []));
</script>
