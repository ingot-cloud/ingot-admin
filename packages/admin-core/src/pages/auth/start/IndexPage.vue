<template>
  <div class="auth-handoff">正在进入登录…</div>
</template>
<script setup lang="ts">
import { bffAuthApi } from "@/api/common/auth";
import { DomainMismatchError, ensureSessionBootstrap } from "@/stores/modules/auth";
import { takeReturnTo } from "@ingot/auth-core";

onMounted(async () => {
  const api = bffAuthApi();
  try {
    await api.me();
  } catch {
    try {
      const created = await api.createTransaction();
      window.location.assign(created.data.loginUrl);
    } catch {
      window.location.replace("/403");
    }
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
