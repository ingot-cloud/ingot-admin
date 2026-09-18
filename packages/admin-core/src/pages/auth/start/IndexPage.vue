<template>
  <div class="auth-handoff">正在进入登录…</div>
</template>
<script setup lang="ts">
import { bffAuthApi } from "@/api/common/auth";
import { DomainMismatchError, ensureSessionBootstrap } from "@/stores/modules/auth";
import { consumeExplicitLogout, takeReturnTo } from "@ingot/auth-core";

onMounted(async () => {
  const api = bffAuthApi();
  if (consumeExplicitLogout()) {
    await privateStartNewTransaction(api);
    return;
  }
  try {
    await api.me();
  } catch {
    await privateStartNewTransaction(api);
    return;
  }
  try {
    await ensureSessionBootstrap();
    window.location.replace(takeReturnTo() ?? "/");
  } catch (error) {
    if (error instanceof DomainMismatchError) {
      window.location.replace("/auth/identity-error");
      return;
    }
    window.location.replace("/500");
  }
});

const privateStartNewTransaction = async (api: ReturnType<typeof bffAuthApi>): Promise<void> => {
  try {
    const created = await api.createTransaction();
    window.location.assign(created.data.loginUrl);
  } catch {
    window.location.replace("/403");
  }
};
</script>
<style lang="postcss" scoped>
.auth-handoff {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  color: var(--in-text-color-secondary);
}
</style>
