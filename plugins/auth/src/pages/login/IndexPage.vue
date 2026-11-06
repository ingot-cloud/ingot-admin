<template>
  <AuthPageShell>
    <AuthPageLoading :loading="restoring">
      <SelectTenant
        v-if="candidates.length"
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
const { restoring, candidates, recoverable, submit, select, success, back, retry } = useOps();
</script>
<style scoped lang="postcss">
.auth-login-retry {
  margin-top: var(--in-space-3);
}
</style>
