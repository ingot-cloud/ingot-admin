<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header description="通讯录可见范围与字段权限。预览来自后端，浏览器不重做策略引擎。" />
    </template>
    <in-split-layout>
      <in-biz-tabs v-model="tab">
        <in-biz-tab-panel title="通讯录可见范围" name="directory">
          <in-button @click="privateLoadDirectory">加载当前规则</in-button>
          <pre class="mt-12px whitespace-pre-wrap text-12px">{{ directoryText }}</pre>
        </in-biz-tab-panel>
        <in-biz-tab-panel title="字段权限" name="fields">
          <in-button @click="privateLoadFields">加载当前规则</in-button>
          <pre class="mt-12px whitespace-pre-wrap text-12px">{{ fieldText }}</pre>
        </in-biz-tab-panel>
      </in-biz-tabs>
    </in-split-layout>
  </in-page-frame>
</template>

<script lang="ts" setup>
import { SecurityDirectoryPolicyAPI, SecurityFieldPolicyAPI } from "@/api/iam/policies";

const tab = ref("directory");
const directoryText = ref("尚未加载");
const fieldText = ref("尚未加载");

const privateLoadDirectory = (): void => {
  SecurityDirectoryPolicyAPI().then((response) => {
    directoryText.value = JSON.stringify(response.data, null, 2);
  });
};

const privateLoadFields = (): void => {
  SecurityFieldPolicyAPI().then((response) => {
    fieldText.value = JSON.stringify(response.data, null, 2);
  });
};
</script>
