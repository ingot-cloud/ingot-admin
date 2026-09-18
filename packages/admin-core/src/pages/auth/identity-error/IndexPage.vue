<template>
  <div class="error-page">
    <div class="img" style="background-image: url(&quot;/resource/images/403.svg&quot;)"></div>
    <div class="content">
      <h1>身份不匹配</h1>
      <div class="desc">当前登录身份不属于本管理台，未装配业务模块。请重新登录本站账号。</div>
      <div class="actions">
        <el-button type="primary" @click="privateOnRelogin">重新登录</el-button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { logoutAndReload } from "@/utils/security";

const privateOnRelogin = () => {
  logoutAndReload();
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
      font-size: 36px;
      font-weight: 600;
      line-height: 44px;
      margin-bottom: 24px;
    }
    & .desc {
      color: rgba(0, 0, 0, 0.45);
      font-size: 20px;
      line-height: 28px;
      margin-bottom: 16px;
      max-width: 360px;
    }
  }
}
</style>
