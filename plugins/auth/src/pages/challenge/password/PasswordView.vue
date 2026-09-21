<template>
  <div class="password-box">
    <div class="title-container">
      <img class="logo-image" :src="session.logoUrl" alt="" />
      <div class="login-title">{{ session.appearance.title }}</div>
      <div class="login-desc">{{ session.appearance.desc }}</div>
    </div>

    <div class="login-container">
      <LoginInput
        v-model="formModel.username"
        placeholder="请输入手机号/账号"
        clearable
        @keyup.enter="privateHandleLogin"
      />
      <LoginInput
        v-model="formModel.password"
        placeholder="请输入密码"
        type="password"
        clearable
        show-password
        @keyup.enter="privateHandleLogin"
      >
        <template #action>
          <div class="forgot" @click="privateHandleForgot">忘记密码</div>
        </template>
      </LoginInput>
      <el-button
        type="primary"
        class="login-btn"
        :loading="loading"
        :disabled="!canLogin"
        @click="privateHandleLogin"
      >
        {{ loading ? "登录中..." : "登录" }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted } from "vue";
import { ElButton } from "element-plus";
import type { LoginResult } from "@ingot/auth-core";
import { useAuthSession } from "../../../session";
import LoginInput from "../components/LoginInput.vue";
import { usePasswordLogin } from "./usePasswordLogin";

const session = useAuthSession();
const emit = defineEmits<{ success: [result: LoginResult] }>();
const { formModel, loading, init, handleLogin } = usePasswordLogin();
const canLogin = computed(
  () => formModel.username.length > 0 && formModel.password.length > 0,
);

const privateHandleLogin = (): void => {
  handleLogin().then((result) => {
    emit("success", result);
  });
};

const privateHandleForgot = (): void => {
  session.warn("请联系管理员");
};

onMounted(() => {
  init();
});
</script>

<style lang="postcss" scoped>
.password-box {
  padding-top: 70px;
  display: flex;
  flex-direction: column;
  align-items: center;

  & .title-container {
    font-size: 18px;
    font-weight: 400;
    margin-bottom: 45px;
    color: var(--in-text-color-secondary);
    display: flex;
    flex-direction: column;
    align-items: center;

    & .logo-image {
      width: 48px;
      height: 48px;
    }

    & .login-title {
      margin: 10px auto 0;
      line-height: 30px;
      font-size: 20px;
      color: #171a1d;
      text-align: center;
      font-weight: bold;
    }

    & .login-desc {
      margin: 0 auto;
      line-height: 30px;
      font-size: 16px;
      color: #171a1d;
      text-align: center;
    }
  }

  & .login-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
    grid-gap: 12px;
    width: 310px;

    & .forgot {
      width: 80px;
      height: var(--login-item-height, 48px);
      line-height: var(--login-item-height, 48px);
      font-size: 14px;
      color: rgba(23, 26, 29, 0.6);
      text-align: center;
      cursor: pointer;
    }

    & .forgot::before {
      content: "";
      display: block;
      position: absolute;
      width: 1px;
      height: 12px;
      left: 0;
      top: 50%;
      margin-top: -6px;
      background: rgba(126, 134, 142, 0.16);
    }

    & .login-btn {
      --el-button-disabled-bg-color: var(--in-color-primary);
      --el-button-disabled-text-color: rgba(255, 255, 255, 0.4);

      width: 100%;
      height: var(--login-item-height, 48px);
      font-size: 16px;
      border-radius: 8px;
    }
  }
}
</style>
