<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header description="组在左侧，有效成员在右侧。部门加人后自动进入组。"
        ><template #action><BizHelpLink view-path="org.iam.groups" /></template
      ></in-page-header>
    </template>
    <group-workspace />
  </in-page-frame>
</template>

<script lang="ts" setup>
import { BizHelpLink } from "@ingot/admin-common";
import GroupWorkspace from "./components/GroupWorkspace.vue";
</script>
