<template>
  <in-dialog :title="title" v-model="visible">
    <div flex flex-col gap-2>
      <div flex flex-row gap-2 p-t-2>
        <div m-r-10px>临时密码</div>
        <in-copy-tag :text="passwordValue"></in-copy-tag>
      </div>
      <div class="text-xs" style="color: var(--in-text-color-secondary)">点击密码即可复制。</div>
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
watch(visible, (open) => {
  if (!open) passwordValue.value = "";
});

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
