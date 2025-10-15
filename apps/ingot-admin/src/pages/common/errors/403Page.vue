<template>
  <div class="error-page">
    <div class="img" style="background-image: url(&quot;/resource/images/403.svg&quot;)"></div>
    <div class="content">
      <h1>403</h1>
      <div class="desc">抱歉，你无权访问该页面</div>
      <div class="actions">
        <el-button type="primary" @click="handleAction">
          {{ buttonText }}
        </el-button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useRouterStore } from "@/stores/modules/router";

import { logoutAndReload } from "@/utils/security";
const { menus } = storeToRefs(useRouterStore());
const buttonText = computed(() => {
  return menus.value.length > 0 ? "返回首页" : "重新登录";
});
const go = useGo();
const handleAction = () => {
  if (menus.value.length > 0) {
    go(
      {
        path: "/",
      },
      true,
    );
  } else {
    logoutAndReload();
  }
};
</script>
<style lang="postcss" scoped>
.error-page {
  background: #f0f2f5;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  & .img {
    margin-right: 80px;
    height: 360px;
    width: 100%;
    max-width: 430px;
    background-repeat: no-repeat;
    background-position: 50% 50%;
    background-size: contain;
  }
  & .content {
    & h1 {
      color: #434e59;
      font-size: 72px;
      font-weight: 600;
      line-height: 72px;
      margin-bottom: 24px;
    }
    & .desc {
      color: rgba(0, 0, 0, 0.45);
      font-size: 20px;
      line-height: 28px;
      margin-bottom: 16px;
    }
  }
}
</style>
