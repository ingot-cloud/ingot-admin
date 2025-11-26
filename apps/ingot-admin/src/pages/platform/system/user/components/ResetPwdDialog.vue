<template>
  <in-dialog :title="title" v-model="visible">
    <div flex flex-col gap-2>
      <div flex flex-row gap-2 p-t-2>
        <div m-r-10px>密码:</div>
        <in-copy-tag :text="passwordValue"></in-copy-tag>
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
const title = ref("请妥善保管密码，登录后及时修改新密码");

const passwordValue = ref("");

const handleConfirmClick = () => {
  visible.value = false;
  passwordValue.value = "";
};

defineExpose({
  show(value: string) {
    visible.value = true;
    passwordValue.value = value;
  },
});
</script>
