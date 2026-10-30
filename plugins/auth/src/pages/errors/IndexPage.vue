<template>
  <AuthPageShell>
    <div class="auth-error">
      <header class="auth-page-header">
        <AuthBrandLogo />
        <div class="auth-error__status" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5" />
            <path
              d="M12 7v6m0 3v.01"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </div>
        <h1 id="auth-page-title">暂时无法完成登录</h1>
        <p class="auth-error__message" role="alert">{{ errorMessage }}</p>
      </header>
      <el-button
        type="primary"
        class="auth-error__back"
        :disabled="!session.startUrl"
        @click="privateHandleBack"
      >
        返回管理台
      </el-button>
    </div>
  </AuthPageShell>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ElButton } from "element-plus";
import { useRoute } from "vue-router";
import AuthBrandLogo from "../../components/AuthBrandLogo.vue";
import AuthPageShell from "../../components/AuthPageShell.vue";
import { useAuthSession } from "../../session";

const session = useAuthSession();
const route = useRoute();
const errorMessage = computed(() => {
  const message = route.query.errorMsg;
  return typeof message === "string" && message ? message : "请从管理台重新发起登录。";
});

const privateHandleBack = (): void => {
  if (session.startUrl) {
    window.location.replace(session.startUrl);
  }
};
</script>

<style scoped lang="postcss">
.auth-error__status {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  margin-top: var(--in-space-8);
  border-radius: 50%;
  background: color-mix(in srgb, var(--in-color-warning) 12%, transparent);
  color: var(--in-color-warning);
}

.auth-error__message {
  white-space: pre-wrap;
}

.auth-error__back {
  width: 100%;
  height: var(--in-auth-control-height);
}
</style>
