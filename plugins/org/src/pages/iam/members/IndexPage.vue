<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header description="成员。账号与成员分离；对象操作看后端能力，脱敏值不回传。" />
    </template>
    <in-split-layout>
      <MemberTab />
    </in-split-layout>
  </in-page-frame>
</template>

<script lang="ts" setup>
import MemberTab from "./components/MemberTab.vue";

const LEGACY_DEPARTMENT_TAB = "departments";
const DEPARTMENT_ROUTE_NAME = "org.iam.departments";

const route = useRoute();
const router = useRouter();

watch(
  () => route.query.tab,
  (tab) => {
    if (tab !== LEGACY_DEPARTMENT_TAB) {
      return;
    }
    const query = { ...route.query };
    delete query.tab;
    void router.replace({ name: DEPARTMENT_ROUTE_NAME, query });
  },
  { immediate: true },
);
</script>
