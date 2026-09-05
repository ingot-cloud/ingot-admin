<template>
  <el-breadcrumb :separator-icon="IconArrowRight" v-if="breadcrumbList.length > 1">
    <el-breadcrumb-item v-for="item in breadcrumbList" :key="item.path" :to="item.path">
      <div flex items-center class="h-[var(--in-breadcrumb-height)]">
        <in-icon
          v-if="item.icon"
          :name="item.icon"
          class="w-[var(--in-breadcrumb-icon-size)] h-[var(--in-breadcrumb-icon-size)] mr-5px"
        />
        <span>{{ item.title }}</span>
      </div>
    </el-breadcrumb-item>
  </el-breadcrumb>
</template>

<script lang="ts" setup>
import IconArrowRight from "@/components/icons/IconArrowRight.vue";
import { buildBreadcrumbList } from "./buildBreadcrumbList";

const route = useRoute();
const breadcrumbList = computed(() => buildBreadcrumbList(route.matched));
</script>
