<template>
  <in-container>
    首页
    <div>{{ getUsername }}</div>
    <div>{{ getRoles }}</div>
    <div>{{ getUserInfoWhetherExist }}</div>
    <div>{{ getIsInitPwd }}</div>
    <div v-auth-any="['1', 'role_admin']">{{ authorities }}</div>
  </in-container>
</template>

<script lang="ts" setup>
import { useUserInfoStore, usePermissions } from "@/stores/modules/auth";

const { getUsername, getRoles, getUserInfoWhetherExist, getIsInitPwd } =
  storeToRefs(useUserInfoStore());
const { authorities } = storeToRefs(usePermissions());
</script>
