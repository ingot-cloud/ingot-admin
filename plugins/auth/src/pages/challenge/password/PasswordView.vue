<template>
  <div class="password-box">
    <header class="auth-page-header">
      <AuthBrandLogo />
      <h1 id="auth-page-title">{{ session.appearance.title }}</h1>
      <p>{{ session.appearance.desc }}</p>
    </header>

    <form class="login-form" :aria-busy="loading" @submit.prevent="privateHandleLogin">
      <div class="login-form__field">
        <label for="login-username">账号</label>
        <LoginInput
          id="login-username"
          v-model="formModel.username"
          name="username"
          autocomplete="username"
          placeholder="请输入手机号或账号"
          clearable
        />
      </div>
      <div class="login-form__field">
        <label for="login-password">密码</label>
        <LoginInput
          id="login-password"
          v-model="formModel.password"
          name="password"
          autocomplete="current-password"
          placeholder="请输入密码"
          type="password"
          clearable
          show-password
        />
      </div>
      <div class="login-form__support">
        <button type="button" class="auth-text-button" @click="privateHandleForgot">
          忘记密码？
        </button>
      </div>
      <el-button
        type="primary"
        native-type="submit"
        class="login-form__submit"
        :loading="loading"
        :disabled="!canLogin || loading"
      >
        {{ loading ? "登录中…" : "登录" }}
      </el-button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { ElButton } from "element-plus";
import type { LoginResult } from "@ingot/auth-core";
import AuthBrandLogo from "../../../components/AuthBrandLogo.vue";
import { useAuthSession } from "../../../session";
import LoginInput from "../components/LoginInput.vue";
import { usePasswordLogin } from "./usePasswordLogin";

const session = useAuthSession();
const emit = defineEmits<{ success: [result: LoginResult] }>();
const { formModel, loading, init, handleLogin } = usePasswordLogin();
const canLogin = computed(() => formModel.username.length > 0 && formModel.password.length > 0);

const privateHandleLogin = async (): Promise<void> => {
  if (!canLogin.value || loading.value) {
    return;
  }
  try {
    const result = await handleLogin();
    emit("success", result);
  } catch {
    // 宿主网络层负责错误提示与挑战取消处理，保留表单供重试。
  }
};

const privateHandleForgot = (): void => {
  session.warn("请联系管理员");
};

onMounted(init);
</script>

<style scoped lang="postcss">
.password-box {
  min-width: 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--in-space-5);
}

.login-form__field {
  display: flex;
  flex-direction: column;
  gap: var(--in-space-2);

  & label {
    color: var(--in-text-color);
    font-weight: 500;
  }
}

.login-form__support {
  display: flex;
  justify-content: flex-end;
  margin-top: calc(-1 * var(--in-space-3));
  margin-bottom: calc(-1 * var(--in-space-2));

  & .auth-text-button {
    font-size: var(--in-font-size-caption);
  }
}

.login-form__submit {
  width: 100%;
  height: var(--in-auth-control-height);
  border-radius: var(--in-radius-control);
  font-size: var(--in-font-size-body);
  font-weight: 500;
}
</style>
