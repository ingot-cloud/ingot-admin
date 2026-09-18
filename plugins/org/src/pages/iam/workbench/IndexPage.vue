<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header description="当前身份可用的业务应用入口。同时受开通、人群和页面操作约束。" />
    </template>
    <in-split-layout>
      <div class="flex flex-wrap gap-16px p-16px">
        <div
          v-for="item in applications"
          :key="item.id"
          class="min-w-200px rounded-8px border p-16px"
        >
          {{ item.name }}
        </div>
        <div v-if="!applications.length">当前没有可用应用</div>
      </div>
    </in-split-layout>
  </in-page-frame>
</template>

<script lang="ts" setup>
import { storeToRefs } from "pinia";
import { usePermissions } from "@ingot/admin-core";

const { applications } = storeToRefs(usePermissions());
</script>
