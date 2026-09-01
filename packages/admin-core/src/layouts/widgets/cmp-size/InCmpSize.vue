<template>
  <el-dropdown trigger="click">
    <span i-mdi-format-size cursor-pointer />

    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item
          v-for="item in ComponentSizeList"
          :key="item.value"
          :disabled="componentSize === item.value"
          @click="appStateStore.changeComponentSize(item.value)"
        >
          {{ item.label }}
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { useAppStateStore } from "@/stores/modules/app";
import { storeToRefs } from "pinia";
import { ComponentSizeList } from "./types";
const appStateStore = useAppStateStore();
const { componentSize } = storeToRefs(appStateStore);
</script>
