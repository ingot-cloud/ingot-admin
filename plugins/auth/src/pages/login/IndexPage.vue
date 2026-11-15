<template>
  <AuthPageShell>
    <AuthPageLoading :loading="restoring">
      <div v-if="logoutPending" role="status">
        <p>注销结果尚未确认，业务请求已暂停。</p>
        <el-button @click="retryLogout">重试确认退出</el-button>
      </div>
      <SelectTenant
        v-else-if="candidates.length"
        :list="candidates"
        :select="select"
        @back="back"
        @success="success"
      />
      <PasswordView v-else :submit="submit" @success="success" />
      <el-button v-if="recoverable && !restoring" class="auth-login-retry" text @click="retry">
        重新确认登录结果
      </el-button>
    </AuthPageLoading>
  </AuthPageShell>
</template>
<script lang="ts" setup>
import { ElButton } from "element-plus";
import AuthPageShell from "../../components/AuthPageShell.vue";
import AuthPageLoading from "../../components/AuthPageLoading.vue";
import PasswordView from "./password/PasswordView.vue";
import SelectTenant from "./select-tenant/SelectTenant.vue";
import { useOps } from "./useOps";
const { restoring, logoutPending, retryLogout, candidates, recoverable, submit, select, success, back, retry } = useOps();
</script>
<style scoped lang="postcss">
.auth-login-retry {
  margin-top: var(--in-space-3);
}
</style>
