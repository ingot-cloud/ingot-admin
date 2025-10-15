<template>
  <in-dialog :title="title" v-model="visible">
    <div flex flex-col gap-2>
      <div flex flex-row gap-2>
        <div w-80px>客户端ID:</div>
        <in-copy-tag :text="appIdValue"></in-copy-tag>
      </div>
      <div flex flex-row gap-2>
        <div w-80px>客户端秘钥:</div>
        <in-copy-tag :text="appSecretValue"></in-copy-tag>
      </div>
      <div font-400 style="font-size: 12px; color: #bbbbbb">*提示:点击即可复制</div>
    </div>

    <template #footer>
      <in-button type="primary" @click="handleConfirmClick"> 确定 </in-button>
    </template>
  </in-dialog>
</template>
<script setup lang="ts">
const visible = ref(false);
const title = ref("请妥善保管客户端ID和客户端秘钥");

const appIdValue = ref("");
const appSecretValue = ref("");

const handleConfirmClick = () => {
  visible.value = false;
  appIdValue.value = "";
  appSecretValue.value = "";
};

defineExpose({
  show(appId: string, appSecret: string) {
    visible.value = true;
    appIdValue.value = appId;
    appSecretValue.value = appSecret;
  },
});
</script>
