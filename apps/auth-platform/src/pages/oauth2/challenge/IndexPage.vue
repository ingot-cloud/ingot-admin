<template>
  <div class="login-page login-page-visible">
    <div class="banner-area" role="banner-area" :style="bannerStyle"></div>
    <div class="login-area">
      <div class="login-box">
        <in-loading :loading="loading">
          <Transition name="fade-transform" mode="out-in">
            <SelectTenant
              v-if="showTenantSelect"
              :list="authorizeResult.allows"
              @back="handleBackToLoginView"
            />
            <PasswordView v-else @success="handleLoginSuccess" :is-show="true" />
          </Transition>
        </in-loading>
      </div>
      <div class="login-copyright-bar">
        <div class="login-copyright">{{ login.copyright }}</div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { LoginResult } from "@ingot/auth-core";
import { useAppStore } from "@/stores/modules/app";
import { useLoginStore } from "@/stores/modules/login";
import { restartIfTransactionExpired } from "@/net/failure";
import PasswordView from "./password/PasswordView.vue";
import SelectTenant from "./select-tenant/SelectTenant.vue";
import "./login.css";

const loading = ref(true);
const { login } = useAppStore();
const loginStore = useLoginStore();
const route = useRoute();
const router = useRouter();
const bannerStyle = `background-image: url("${login.loginBanner}");`;
const showTenantSelect = ref(false);
const authorizeResult = ref<LoginResult>({ stage: "SELECT_TENANT", transactionId: "", allows: [] });
const handleLoginSuccess = (result: LoginResult) => {
  if (result.stage === "READY") {
    loginStore.followReady(result);
    return;
  }
  if (loginStore.authEntry === "platform") {
    return;
  }
  authorizeResult.value = result;
  showTenantSelect.value = true;
};
const handleBackToLoginView = () => {
  showTenantSelect.value = false;
};

onBeforeMount(async () => {
  const tx = typeof route.query.tx === "string" ? route.query.tx : "";
  if (!tx) {
    const startUrl = import.meta.env.VITE_APP_ADMIN_START_URL;
    if (startUrl) {
      window.location.replace(startUrl);
      return;
    }
    await router.replace({
      path: "/errors",
      query: { errorMsg: "缺少登录事务，请从管理台重新进入" },
    });
    return;
  }
  try {
    const snapshot = await loginStore.restoreTransaction(tx);
    if (snapshot.stage === "READY" && snapshot.completionUrl) {
      window.location.assign(snapshot.completionUrl);
      return;
    }
    if (snapshot.stage === "SELECT_TENANT" && snapshot.allows?.length) {
      authorizeResult.value = {
        stage: "SELECT_TENANT",
        transactionId: snapshot.transactionId,
        allows: snapshot.allows,
      };
      showTenantSelect.value = loginStore.authEntry !== "platform";
    }
  } catch (error) {
    if (restartIfTransactionExpired(error)) {
      return;
    }
    await router.replace({
      path: "/errors",
      query: { errorMsg: "登录事务已失效，请从管理台重新进入" },
    });
    return;
  } finally {
    loading.value = false;
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
