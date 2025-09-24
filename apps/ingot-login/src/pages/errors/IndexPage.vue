<template>
  <div class="page-wrapper">
    <div class="page-main-area">
      <img class="page-main-image" :src="login.errorImage" />
      <div class="page-main-title">出错了</div>
      <div class="page-main-desc">
        {{ route.query.errorMsg }}
      </div>
      <div class="page-main-btn base-comp-button base-comp-button-type-default" @click="handleBack">
        返回
      </div>
    </div>
    <div class="page-bottom-area">
      {{ login.copyright }}
    </div>
  </div>
</template>
<script lang="ts" setup>
import { useAppStore } from "@/stores/modules/app";
const { login } = useAppStore();

const route = useRoute();
const handleBack = () => {
  const query = route.query;
  if (query.redirect_uri) {
    window.location.href = query.redirect_uri as string;
  }
};
</script>
<style scoped lang="postcss">
.page-wrapper {
  overflow: hidden;
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: #121212;

  & .page-main-area {
    position: absolute;
    left: 32px;
    right: 32px;
    top: 50%;
    transform: translateY(-60%);
    -webkit-transform: translateY(-60%);

    & .page-main-image {
      display: block;
      position: relative;
      width: 146px;
      height: 232px;
      margin: 0 auto;
    }

    & .page-main-title {
      margin: 24px auto 8px;
      line-height: 40px;
      font-size: 24px;
      color: rgba(255, 255, 255, 0.96);
      text-align: center;
      font-weight: bold;
    }

    & .page-main-desc {
      overflow: hidden;
      margin: 0 auto;
      max-width: 600px;
      max-height: 200px;
      line-height: 20px;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.48);
      text-align: center;
    }

    & .page-main-btn {
      width: 120px;
      margin: 24px auto 0;
      color: rgba(255, 255, 255, 0.96);
      background: rgba(255, 255, 255, 0);
      border: 1px solid rgba(126, 134, 142, 0.16);
      box-sizing: border-box;
      position: relative;
      height: 48px;
      line-height: 48px;
      font-size: 16px;
      text-align: center;
      border-radius: 8px;
      cursor: pointer;
    }
  }

  & .page-bottom-area {
    position: absolute;
    bottom: 16px;
    left: 16px;
    right: 16px;
    line-height: 20px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.48);
    text-align: center;
  }
}
</style>
