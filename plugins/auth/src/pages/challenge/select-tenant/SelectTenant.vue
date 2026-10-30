<template>
  <AuthPageLoading :loading="loading">
    <div class="select-tenant-box">
      <button type="button" class="auth-text-button select-tenant-back" @click="privateHandleBack">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7l7-7"
          />
        </svg>
        返回登录
      </button>
      <header class="auth-page-header">
        <AuthBrandLogo />
        <h1 id="auth-page-title">选择组织</h1>
        <p>请选择你要进入的管理空间</p>
      </header>
      <ul class="tenant-scroll" aria-label="可进入的组织">
        <li v-for="item in list" :key="item.id">
          <TenantItemView :id="item.id" :name="item.name" @click="privateHandleItemClick(item)" />
        </li>
      </ul>
    </div>
  </AuthPageLoading>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import type { TenantCandidate } from "@ingot/auth-core";
import AuthBrandLogo from "../../../components/AuthBrandLogo.vue";
import AuthPageLoading from "../../../components/AuthPageLoading.vue";
import { useAuthSession } from "../../../session";
import TenantItemView from "./TenantItem.vue";

defineProps<{
  list?: TenantCandidate[];
}>();

const emit = defineEmits<{ back: [] }>();
const session = useAuthSession();
const loading = ref(false);

const privateHandleBack = (): void => {
  emit("back");
};

const privateHandleItemClick = (params: TenantCandidate): void => {
  if (loading.value) {
    return;
  }
  loading.value = true;
  session.selectTenant(params.id).catch(() => {
    loading.value = false;
  });
};
</script>

<style scoped lang="postcss">
.select-tenant-box {
  min-width: 0;
}

.select-tenant-back {
  margin-top: calc(-1 * var(--in-space-2));
  margin-bottom: var(--in-space-5);
  font-size: var(--in-font-size-caption);
}

.tenant-scroll {
  display: flex;
  flex-direction: column;
  gap: var(--in-space-3);
  max-height: min(360px, 45svh);
  margin: 0 -4px;
  padding: 4px;
  overflow-y: auto;
  overscroll-behavior: contain;
  list-style: none;
}
</style>
