<template>
  <div class="auth-handoff">正在完成登录…</div>
</template>
<script setup lang="ts">
import { bffAuthApi } from "@/api/common/auth";
import { publishIdentityInvalidated } from "@/stores/modules/auth";
import { takeReturnTo } from "@ingot/auth-core";

const route = useRoute();

onMounted(async () => {
  const ticket = typeof route.query.ticket === "string" ? route.query.ticket : "";
  const clean = new URL(window.location.href);
  clean.searchParams.delete("ticket");
  window.history.replaceState({}, document.title, `${clean.pathname}${clean.search}${clean.hash}`);
  if (!ticket) {
    window.location.replace("/auth/start");
    return;
  }
  try {
    const completed = await bffAuthApi().complete(ticket);
    publishIdentityInvalidated();
    window.location.replace(takeReturnTo() ?? completed.data.returnTo ?? "/");
  } catch {
    window.location.replace("/auth/start");
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
