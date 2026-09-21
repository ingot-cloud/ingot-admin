<template>
  <div class="login-page login-page-visible">
    <div class="banner-area" role="banner-area" :style="bannerStyle"></div>
    <div class="login-area">
      <div class="login-box">
        <AuthPageLoading :loading="loading">
          <Transition name="fade-transform" mode="out-in">
            <SelectTenant
              v-if="showTenantSelect"
              :list="authorizeResult.allows"
              @back="privateHandleBackToLoginView"
            />
            <PasswordView v-else @success="privateHandleLoginSuccess" />
          </Transition>
        </AuthPageLoading>
      </div>
      <div class="login-copyright-bar">
        <div class="login-copyright">{{ session.appearance.copyright }}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeMount, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { LoginResult } from "@ingot/auth-core";
import AuthPageLoading from "../../components/AuthPageLoading.vue";
import { useAuthSession } from "../../session";
import PasswordView from "./password/PasswordView.vue";
import SelectTenant from "./select-tenant/SelectTenant.vue";

const session = useAuthSession();
const route = useRoute();
const router = useRouter();
const loading = ref(true);
const showTenantSelect = ref(false);
const authorizeResult = ref<LoginResult>({ stage: "SELECT_TENANT", transactionId: "", allows: [] });
const bannerStyle = computed(() => `background-image: url("${session.appearance.loginBanner}");`);

const privateHandleLoginSuccess = (result: LoginResult): void => {
  if (result.stage === "READY") {
    session.followReady(result);
    return;
  }
  if (!session.includeTenantSelect) {
    return;
  }
  authorizeResult.value = result;
  showTenantSelect.value = true;
};

const privateHandleBackToLoginView = (): void => {
  showTenantSelect.value = false;
};

onBeforeMount(async () => {
  const tx = typeof route.query.tx === "string" ? route.query.tx : "";
  if (!tx) {
    if (session.startUrl) {
      window.location.replace(session.startUrl);
      return;
    }
    await router.replace({
      path: "/errors",
      query: { errorMsg: "缺少登录事务，请从管理台重新进入" },
    });
    return;
  }
  try {
    const snapshot = await session.restoreTransaction(tx);
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
      showTenantSelect.value = session.includeTenantSelect;
    }
  } catch (error) {
    if (session.restartIfExpired(error)) {
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
    width: var(--login-banner-area-width, 500px);
    left: 0;
    top: 0;
    bottom: 0;
    background-color: #f2f4f7;
    background-size: cover !important;
    background-position: center center;
  }

  & .login-area {
    position: absolute;
    left: var(--login-banner-area-width, 500px);
    top: 0;
    right: 0;
    bottom: 0;

    & .login-box {
      position: absolute;
      width: var(--login-box-width, 480px);
      height: var(--login-box-height, 600px);
      left: 50%;
      top: 50%;
      margin-left: calc(var(--login-box-width, 480px) / 2 * -1);
      margin-top: calc(var(--login-box-height, 600px) / 2 * -1);
      background: #ffffff;
      border-radius: 10px;
      border: 1px solid rgba(126, 134, 142, 0.16);
      box-shadow: 0 4px 14px 0 rgba(126, 134, 142, 0.16);
    }

    & .login-copyright-bar {
      position: absolute;
      width: var(--login-copyright-bar-width, 480px);
      height: var(--login-copyright-bar-height, 60px);
      bottom: 0;
      left: 50%;
      margin-left: calc(var(--login-copyright-bar-width, 480px) / 2 * -1);
      line-height: var(--login-copyright-bar-height, 60px);
      font-size: 12px;
      color: rgba(23, 26, 29, 0.6);
      text-align: left;
      & .login-copyright {
        float: left;
        padding: 0 7px;
      }
    }
  }

  @media (max-width: 1100px) {
    & .banner-area {
      display: none;
    }

    & .login-area {
      left: 0;
    }
  }

  @media (max-width: 560px) {
    & .login-area {
      & .login-box {
        width: min(480px, calc(100% - 32px));
        height: auto;
        min-height: 520px;
        left: 50%;
        margin-left: 0;
        transform: translate(-50%, -50%);
      }

      & .login-copyright-bar {
        width: 100%;
        left: 0;
        margin-left: 0;
        text-align: center;

        & .login-copyright {
          float: none;
        }
      }
    }
  }
}
</style>
