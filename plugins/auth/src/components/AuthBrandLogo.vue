<template>
  <span class="auth-brand-logo" aria-hidden="true">
    <img class="auth-brand-logo__light" :src="session.logoUrl" alt="" width="48" height="48" />
    <img
      class="auth-brand-logo__dark"
      :src="session.logoDarkUrl || session.logoUrl"
      alt=""
      width="48"
      height="48"
    />
  </span>
</template>

<script setup lang="ts">
import { useAuthSession } from "../session";

const session = useAuthSession();
</script>

<style scoped lang="postcss">
.auth-brand-logo {
  display: inline-flex;
  flex: none;
  width: 48px;
  height: 48px;

  & img {
    display: block;
    width: 100%;
    height: 100%;
  }

  & .auth-brand-logo__dark {
    display: none;
  }
}

html.dark .auth-brand-logo__light {
  display: none;
}

html.dark .auth-brand-logo__dark {
  display: block;
}
</style>
