<template>
  <AuthPageShell>
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
  </AuthPageShell>
</template>

<script lang="ts" setup>
import { onBeforeMount, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { LoginResult } from "@ingot/auth-core";
import AuthPageShell from "../../components/AuthPageShell.vue";
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
