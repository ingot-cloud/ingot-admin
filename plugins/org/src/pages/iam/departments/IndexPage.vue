<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header description="部门。维护组织架构；非空删除由服务端返回限制。"
        ><template #action><BizHelpLink view-path="org.iam.departments" /></template
      ></in-page-header>
    </template>
    <in-split-layout>
      <DeptTab />
    </in-split-layout>
  </in-page-frame>
</template>

<script lang="ts" setup>
import { BizHelpLink } from "@ingot/admin-common";
import DeptTab from "../members/components/DeptTab.vue";
</script>
