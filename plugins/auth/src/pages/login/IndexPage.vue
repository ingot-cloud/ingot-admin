<template>
  <AuthPageShell>
    <AuthPageLoading :loading="restoring">
      <div v-if="errorMessage" class="auth-login-error" role="alert">
        <p>{{ errorMessage }}</p>
        <el-button v-if="recoverable" text @click="retry">重新确认登录结果</el-button>
      </div>
      <SelectTenant
        v-if="candidates.length"
        :list="candidates"
        :select="select"
        @back="back"
        @success="success"
      />
      <PasswordView v-else :submit="submit" @success="success" />
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
const { restoring, candidates, errorMessage, recoverable, submit, select, success, back, retry } =
  useOps();
</script>
<style scoped lang="postcss">
.auth-login-error {
  margin-bottom: var(--in-space-4);
  color: var(--in-color-danger);
  overflow-wrap: anywhere;
}
</style>
