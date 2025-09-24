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
import type { RouteLocationMatched } from "vue-router";
import type { BreadCrumbRecord } from "./types";
import IconArrowRight from "@/components/icons/IconArrowRight.vue";

const route = useRoute();
const breadcrumbList = computed(() => {
  return getBreadcrumbList(route.matched);
});

const getBreadcrumbList = (matched: Array<RouteLocationMatched>): Array<BreadCrumbRecord> => {
  const list: Array<BreadCrumbRecord> = [];

  matched
    .filter((item) => !item.meta || !item.meta.hideBreadcrumb)
    .forEach((item) => {
      list.push({
        path: item.path,
        title: item.meta?.title || "",
        icon: item.meta?.icon,
        redirect: item.redirect?.toString(),
        children: item.children?.map((item) => {
          return {
            path: item.path,
            title: item.meta?.title || "",
            icon: item.meta?.icon,
            redirect: item.redirect?.toString(),
          };
        }),
      });
    });

  const cLen = list.length;
  if (cLen === 0) {
    return list;
  }
  // 如果存在前一个菜单，那么判断前一个菜单是否为重定向到child的菜单
  // 如果是重定向到child的菜单，并且这个菜单的children只有1个
  // 那么将其删掉，只保留child即可
  const path = list[cLen - 1].path;
  if (cLen > 1 && list[cLen - 2].redirect === path && list[cLen - 2].children?.length === 1) {
    // 避免删除后icon丢失，赋值父级cion
    list[cLen - 1].icon = list[cLen - 2].icon;
    list.splice(cLen - 2, 1);
  }

  return list;
};
</script>
