<template>
  <div class="login-page login-page-visible">
    <div class="banner-area" role="banner-area" :style="bannerStyle"></div>
    <div class="login-area">
      <div class="login-box" v-loading="loading">
        <Transition name="fade-transform" mode="out-in">
          <SelectTenant
            v-if="isStepOneSuccess"
            :list="authorizeResult.allows"
            @back="handleBackToLoginView"
          />
          <div v-else>
            <div class="login-switcher" @click="handleSwitch">
              <img :src="isScanLogin ? PasswordLoginImage : QrCodeLoginImage" />
            </div>
            <Transition name="fade-transform" mode="out-in">
              <QrCodeView v-if="isScanLogin" />
              <PasswordView v-else @success="handlePreAuthorizeSuccess" :is-show="true" />
            </Transition>
          </div>
        </Transition>
      </div>
      <div class="login-copyright-bar">
        <div class="login-copyright">{{ login.copyright }}</div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { PreAuthorizeResult } from "@/models";
import { useAppStore } from "@/stores/modules/app";
import { useLoginStore } from "@/stores/modules/login";
import PasswordView from "./password/PasswordView.vue";
import QrCodeView from "./qrcode/QrCodeView.vue";
import SelectTenant from "./select-tenant/SelectTenant.vue";
import PasswordLoginImage from "@/assets/password-login.png";
import QrCodeLoginImage from "@/assets/qrcode-login.png";
import "./login.css";

const loading = ref(false);
const { login } = useAppStore();
const loginStore = useLoginStore();
const bannerStyle = `background-image: url("${login.loginBanner}");`;
const isScanLogin = ref(false); // 是否为扫码登录
const isStepOneSuccess = ref(false); // 是否预授权成功
const authorizeResult = ref<PreAuthorizeResult>({});
const handleSwitch = () => {
  isScanLogin.value = !isScanLogin.value;
};
const handlePreAuthorizeSuccess = (result: PreAuthorizeResult) => {
  authorizeResult.value = result;
  isStepOneSuccess.value = true;
};
const handleBackToLoginView = () => {
  isStepOneSuccess.value = false;
};

onBeforeMount(() => {
  const result = loginStore.getPreAuthorizeResult;
  if (result && result.allows) {
    handlePreAuthorizeSuccess(result);
  }
});
</script>
<style lang="postcss" scoped>
.login-page {
  overflow: hidden;
  position: relative;
  width: 100%;
  height: 100vh;
  margin: 0;
  padding: 0;
  background: #ffffff;
  opacity: 0.01;
  transition: opacity 0.3s;

  &.login-page-visible {
    opacity: 1;
  }

  & .banner-area {
    position: absolute;
    width: var(--login-banner-area-width);
    left: 0;
    top: 0;
    bottom: 0;
    background-size: cover !important;
    background-position: center center;
  }

  & .login-area {
    position: absolute;
    left: var(--login-banner-area-width);
    top: 0;
    right: 0;
    bottom: 0;

    & .login-box {
      position: absolute;
      width: var(--login-box-width);
      height: var(--login-box-height);
      left: 50%;
      top: 50%;
      margin-left: calc(var(--login-box-width) / 2 * -1);
      margin-top: calc(var(--login-box-height) / 2 * -1);
      border-radius: 10px;
      border: 1px solid rgba(126, 134, 142, 0.16);
      box-shadow: 0 4px 14px 0 rgba(126, 134, 142, 0.16);
    }

    & .login-copyright-bar {
      position: absolute;
      width: var(--login-copyright-bar-width);
      height: var(--login-copyright-bar-height);
      bottom: 0;
      left: 50%;
      margin-left: calc(var(--login-copyright-bar-width) / 2 * -1);
      line-height: var(--login-copyright-bar-height);
      font-size: 12px;
      color: rgba(23, 26, 29, 0.6);
      text-align: left;
      & .login-copyright {
        float: left;
        padding: 0 7px;
      }
    }
  }
}
</style>
