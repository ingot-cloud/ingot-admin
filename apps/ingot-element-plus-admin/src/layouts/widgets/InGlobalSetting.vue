<template>
  <div class="in-global-setting" cursor-pointer @click="onClick">
    <in-icon name="icon-park-outline:setting-config" class="icon" />
  </div>
  <in-drawer v-model="drawer" title="配置" size="300px">
    <div class="in-global-setting-list">
      <div class="in-global-setting-item">
        <span class="title">主题模式</span>
        <in-switch-dark />
      </div>
      <div class="in-global-setting-item">
        <span class="title">字体大小</span>
        <in-cmp-size />
      </div>
      <div class="in-global-setting-item">
        <span class="title">面包屑</span>
        <el-switch v-model="appStateStore.showBreadcrumb" />
      </div>
      <div class="in-global-setting-item">
        <span class="title">Tabs</span>
        <el-switch v-model="appStateStore.showTabs" />
      </div>
      <div class="in-global-setting-item">
        <span class="title">版权信息</span>
        <el-switch v-model="appStateStore.showCopyright" />
      </div>
      <div class="in-global-setting-item">
        <span class="title">搜索栏</span>
        <el-switch v-model="appStateStore.showSearch" />
      </div>
      <div class="in-global-setting-item">
        <span class="title">水印</span>
        <el-switch v-model="appStateStore.showWatermark" />
      </div>
    </div>
  </in-drawer>
</template>
<script setup lang="ts">
import { useAppStateStore } from "@/stores/modules/app";
import { useUserInfoStore } from "@/stores/modules/auth";
import watermark from "@/utils/watermark";

const appStateStore = useAppStateStore();
const userInfoStore = useUserInfoStore();
const drawer = ref(false);

const onClick = () => {
  drawer.value = true;
};

watch(
  () => appStateStore.showWatermark,
  (val) => {
    if (val) {
      watermark.set(`${userInfoStore.getUsername!}@${userInfoStore.getSensitivePhone}`);
    } else {
      watermark.del();
    }
  },
  {
    immediate: true,
  },
);
</script>
<style scoped lang="postcss">
.in-global-setting {
  width: var(--in-app-bar-icon-size);
  height: var(--in-app-bar-icon-size);
  & .icon {
    color: white;
    width: var(--in-app-bar-icon-size);
    height: var(--in-app-bar-icon-size);
  }
}
.in-global-setting-list {
  @apply gap-2;
}
.in-global-setting-item {
  @apply flex flex-row items-center;
  border-bottom: 1px solid var(--in-border-color);
  padding: 5px 0;
  height: 30px;
  & .title {
    flex: 1;
    font-size: 14px;
    color: var(--in-text-color);
  }
}
</style>
